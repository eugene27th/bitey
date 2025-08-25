const config = require(`${process.cwd()}/config.json`);

const parser = require(`./parser`);
const logger = require(`./logger`);
const challenge = require(`./challenge`);


module.exports = function(app) {
    app.options(`/*`, function(res, req) {
        const origin = req.getHeader(`origin`);

        res.writeHeader(`Vary`, `Origin`);
        res.writeHeader(`Access-Control-Allow-Methods`, `GET,POST,PATCH,DELETE`);

        if (config.cors?.origin && config.cors.origin.includes(origin)) {
            res.writeHeader(`Access-Control-Allow-Origin`, origin);
        };

        if (config.cors?.credentials) {
            res.writeHeader(`Access-Control-Allow-Credentials`, `true`);
        };

        if (config.headers) {
            res.writeHeader(`Access-Control-Allow-Headers`, config.headers.join(`,`));
        };

        return res.end();
    });

    app.http = {
        methods: {
            get: {},
            post: {},
            patch: {},
            del: {}
        },
        requests: {}
    };

    setInterval(() => {
        app.http.requests = {};
    }, config.guard.http[1] * 1000);

    for (const method of Object.keys(app.http.methods)) {
        app[`_${method}`] = app[method].bind(app);

        app[method] = function(url, options, handler) {
            app.http.methods[method][url] = {
                config: {
                    buffer: options.config?.buffer !== undefined ? options.config.buffer : false,
                    guard: options.config?.guard !== undefined ? options.config.guard : null,
                    turnstile: options.config?.turnstile !== undefined ? options.config.turnstile : false,
                    log: {
                        headers: options.config?.log?.headers !== undefined ? options.config.log?.headers : false,
                        payload: options.config?.log?.payload !== undefined ? options.config.log?.payload : true
                    }
                },
                schema: options.schema || null,
                handlers: (options.middlewares || []).concat(handler).reverse(),
                requests: {}
            };

            if (app.http.methods[method][url].config.guard) {
                setInterval(() => {
                    app.http.methods[method][url].requests = {};
                }, app.http.methods[method][url].config.guard[1] * 1000);
            };

            app[`_${method}`](url, async function(res, req) {
                res.headers = [];

                res.onAborted(function() {
                    res.aborted = true;
                });

                res.setHeader = function(name, value) {
                    if (res.aborted) {
                        return false;
                    };

                    res.headers.push([name, value]);
                };

                res.send = function(data, status) {
                    if (res.aborted) {
                        return false;
                    };

                    res.cork(function() {
                        res.writeStatus(`${status || 200}`);

                        if (config.cors) {
                            if (config.cors.origin && req.headers[`origin`] && config.cors.origin.includes(req.headers[`origin`])) {
                                res.writeHeader(`Access-Control-Allow-Origin`, req.headers[`origin`]);
                            };

                            if (config.cors.credentials) {
                                res.writeHeader(`Access-Control-Allow-Credentials`, `true`);
                            };
                        };

                        if (res.headers.length > 0) {
                            for (const [name, value] of res.headers) {
                                res.writeHeader(name, value);
                            };
                        };

                        if (!data) {
                            return res.end();
                        };

                        if (typeof data === `object`) {
                            res.writeHeader(`Content-Type`, `application/json`);
                            return res.end(JSON.stringify(data));
                        };

                        res.end(data);
                    });
                };

                res.redirect = function(url) {
                    if (res.aborted) {
                        return false;
                    };

                    res.setHeader(`Location`, url);
                    res.send(true, 302);
                };

                req.url = url;
                req.method = method;

                req.config = app.http.methods[method][url].config;
                req.schema = app.http.methods[method][url].schema;

                req.headers = {
                    "origin": req.getHeader(`origin`),
                    "content-type": req.getHeader(`content-type`),
                    "cf-connecting-ip": req.getHeader(`cf-connecting-ip`),
                    "cf-ipcountry": req.getHeader(`cf-ipcountry`),
                    "cf-challenge": req.getHeader(`cf-challenge`)
                };

                if (config.headers) {
                    for (const name of config.headers) {
                        const header = req.getHeader(name);

                        if (header.length > 0) {
                            req.headers[name] = header;
                        };
                    };
                };

                req.user = {
                    ip: req.headers[`cf-connecting-ip`] || `127.0.0.1`,
                    country: req.headers[`cf-ipcountry`] || null
                };

                if (app.http.requests[req.user.ip] === undefined) {
                    app.http.requests[req.user.ip] = 1;
                } else {
                    app.http.requests[req.user.ip]++;
                };

                if (app.http.requests[req.user.ip] > config.guard.http[0]) {
                    return res.send({
                        error: `ER_RATE_LIMIT`,
                        message: `${config.guard.http[0]} attempts per ${config.guard.http[1]} seconds`
                    }, 429);
                };

                if (req.config?.guard) {
                    if (app.http.methods[req.method][req.url].requests[req.user.ip] === undefined) {
                        app.http.methods[req.method][req.url].requests[req.user.ip] = 1;
                    } else {
                        app.http.methods[req.method][req.url].requests[req.user.ip]++;
                    };

                    if (app.http.methods[req.method][req.url].requests[req.user.ip] > req.config.guard[0]) {
                        return res.send({
                            error: `ER_RATE_LIMIT`,
                            message: `${req.config.guard[0]} attempts per ${req.config.guard[1]} seconds on this route`
                        }, 429);
                    };
                };

                if (app.http.methods[method][url].schema?.params) {
                    req.params = parser.params(req);

                    if (req.params.error) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: req.params.error
                        }, 400);
                    };
                };

                if (app.http.methods[method][url].schema?.query) {
                    req.query = parser.query(req);

                    if (req.query.error) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: req.query.error
                        }, 400);
                    };
                };

                let buffer;

                res.onData(async function(ab, last) {
                    let chunk = Buffer.from(ab);

                    if (buffer) {
                        buffer = Buffer.concat([buffer, chunk]);
                    } else {
                        buffer = Buffer.concat([chunk]);
                    };

                    if (last) {
                        if (buffer.length > 0) {
                            req.buffer = buffer;
                        };

                        if (app.http.methods[method][url].schema?.body) {
                            req.body = parser.body(req);

                            if (req.body.error) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: req.body.error
                                }, 400);
                            };
                        };

                        if (!app.http.methods[method][url].config.buffer && req.buffer) {
                            delete req.buffer;
                        };

                        if (config.cloudflare?.turnstile && app.http.methods[method][url].config.turnstile) {
                            const result = await challenge.turnstile(req);

                            if (result.error) {
                                return res.send({
                                    error: result.error,
                                    message: result.message
                                }, 403);
                            };
                        };

                        let logText = `http:${req.method} > ${req.user.ip} > ${req.url}`;

                        if (req.config?.log?.headers) {
                            logText += ` > headers: ${JSON.stringify(req.headers)}`;
                        };

                        if (req.config?.log?.payload && req.schema) {
                            logText += ` > payload: ${JSON.stringify({ params: req.params || null, query: req.query || null, body: req.body || null })}`;
                        };

                        logger.log(logText);

                        let steps = app.http.methods[method][url].handlers.length - 1;

                        const next = function() {
                            if (res.aborted) {
                                return false;
                            };

                            if (steps >= 0) {
                                res.cork(async function() {
                                    try {
                                        return await app.http.methods[method][url].handlers[steps--](res, req, next);
                                    } catch (err) {
                                        console.log(`http debug: err from http handler -> `, err);

                                        return res.send({
                                            error: err.code || `ER_UNEXPECTED`,
                                            ...err.extra
                                        }, err.status || 500);
                                    };
                                });
                            };
                        };

                        return next();
                    };
                });
            });
        };
    };
};