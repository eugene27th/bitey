const config = require(`${process.cwd()}/config.json`);

const parser = require(`./parser`);
const logger = require(`./logger`);


module.exports = function(app) {
    app.options(`/*`, function(res, req) {
        const origin = req.getHeader(`origin`);

        let headers = [`origin`, `content-type`];

        if (config.headers) {
            headers = headers.concat(config.headers);
        };

        res.cork(function() {
            res.writeHeader(`vary`, `Origin`);
            res.writeHeader(`access-control-allow-methods`, `GET, POST, PATCH, PUT, DELETE`);

            if (config.cors?.origin && config.cors.origin.includes(origin)) {
                res.writeHeader(`access-control-allow-origin`, origin);
            };

            if (config.cors?.credentials) {
                res.writeHeader(`access-control-allow-credentials`, `true`);
            };

            res.writeHeader(`access-control-allow-headers`, headers.join(`, `));

            res.end();
        });
    });

    app.http = {
        methods: {
            get: {},
            post: {},
            patch: {},
            put: {},
            del: {}
        },
        requests: {}
    };

    if (config.guard) {
        setInterval(() => {
            app.http.requests = {};
        }, config.guard.http[1] * 1000);
    };

    for (const method of Object.keys(app.http.methods)) {
        app[`_${method}`] = app[method].bind(app);

        app[method] = function(url, options, handler) {
            app.http.methods[method][url] = {
                config: {
                    buffer: options.config?.buffer !== undefined ? options.config.buffer : false,
                    guard: options.config?.guard !== undefined ? options.config.guard : null,
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

            app[`_${method}`](url, function(res, req) {
                res.onAborted(function() {
                    res.aborted = true;
                });

                res.send = function(dataOrStatus, onlyStatus) {
                    if (res.aborted) {
                        return false;
                    };

                    let data;
                    let status;

                    if (!dataOrStatus || typeof dataOrStatus === `number`) {
                        status = dataOrStatus || 204;
                    } else {
                        data = dataOrStatus;
                        status = onlyStatus ? onlyStatus : 200;
                    };

                    res.cork(function() {
                        res.writeStatus(`${status}`);

                        if (config.cors) {
                            res.writeHeader(`vary`, `Origin`);

                            if (config.cors.origin && req.headers[`origin`] && config.cors.origin.includes(req.headers[`origin`])) {
                                res.writeHeader(`access-control-allow-origin`, req.headers[`origin`]);
                            };

                            if (config.cors.credentials) {
                                res.writeHeader(`access-control-allow-credentials`, `true`);
                            };
                        };

                        if (data && typeof data === `object`) {
                            data = JSON.stringify(data);
                            res.writeHeader(`content-type`, `application/json`);
                        };

                        data ? res.end(data) : res.endWithoutBody();
                    });
                };

                res.redirect = function(url) {
                    if (res.aborted) {
                        return false;
                    };

                    res.cork(function() {
                        res.writeStatus(`302`);
                        res.writeHeader(`location`, url);
                        res.endWithoutBody();
                    });
                };

                req.url = url;
                req.method = method;

                req.config = app.http.methods[method][url].config;
                req.schema = app.http.methods[method][url].schema;

                req.headers = {
                    "origin": req.getHeader(`origin`) || null,
                    "content-type": req.getHeader(`content-type`) || null,
                    "x-real-ip": req.getHeader(`x-real-ip`) || null // добавляется из nginx
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
                    ip: req.headers[`x-real-ip`] || `1.1.1.1`
                };

                if (config.guard) {
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

                        if (config.logger) {
                            let logText = `http:${req.method} > ${req.user.ip} > ${req.url}`;

                            if (req.config?.log?.headers) {
                                logText += ` > headers: ${JSON.stringify(req.headers)}`;
                            };

                            if (req.config?.log?.payload && req.schema) {
                                logText += ` > payload: ${JSON.stringify({ params: req.params || null, query: req.query || null, body: req.body || null })}`;
                            };

                            logger.log(logText);
                        };

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