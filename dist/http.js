const config = require(`${process.cwd()}/config.json`);

const guard = require(`./guard`);
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

    for (const method of [`get`, `post`, `patch`, `del`]) {
        app[`__${method}`] = app[method].bind(app);

        app[method] = function(url, options, callback) {
            app[`__${method}`](url, async function(res, req) {
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
                        if (status) {
                            res.writeStatus(`${status}`);
                        } else if (data === true) {
                            res.writeStatus(`204`);
                        } else if (typeof data === `undefined`) {
                            data = {
                                error: `ER_NOT_FOUND`
                            };

                            res.writeStatus(`404`);
                        };

                        if (config.cors) {
                            if (config.cors.origin && config.cors.origin.includes(req.headers.origin)) {
                                res.writeHeader(`Access-Control-Allow-Origin`, req.headers.origin);
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

                        if (data === true) {
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
                req.headers = {};

                req.options = {
                    config: {
                        raw: options.config?.raw !== undefined ? options.config.raw : false,
                        guard: options.config?.guard !== undefined ? options.config.guard : null,
                        turnstile: options.config?.turnstile !== undefined ? options.config.turnstile : false,
                        log: {
                            headers: options.config?.log?.headers !== undefined ? options.config.log?.headers : false,
                            payload: options.config?.log?.payload !== undefined ? options.config.log?.payload : true
                        }
                    },
                    middlewares: options.middlewares || [],
                    schema: options.schema
                };

                if (config.headers) {
                    for (const name of config.headers) {
                        const header = req.getHeader(name);

                        if (header.length > 0) {
                            req.headers[name] = header;
                        };
                    };
                };

                if (config.guard || req.options.config.guard) {
                    const result = guard.http(req);

                    if (result.error) {
                        return res.send({
                            error: `ER_RATE_LIMIT`,
                            message: result.error
                        }, 429);
                    };
                };

                if (req.options.schema?.params) {
                    req.params = parser.params(req);

                    if (req.params.error) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: req.params.error
                        }, 400);
                    };
                };

                if (req.options.schema?.query) {
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
                            req.raw = buffer;
                        };

                        if (req.options.schema?.body) {
                            req.body = parser.body(req);

                            if (req.body.error) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: req.body.error
                                }, 400);
                            };
                        };

                        if (!req.options.config.raw && req.raw) {
                            delete req.raw;
                        };

                        if (config.cloudflare?.turnstile && req.options.config.turnstile) {
                            const result = await challenge.turnstile(req);

                            if (result.error) {
                                return res.send({
                                    error: result.error,
                                    message: result.message
                                }, 400);
                            };
                        };

                        logger.http(req);

                        const callbacks = req.options.middlewares.concat(callback);

                        let cstep = 0;
                        const mstep = callbacks.length;

                        const next = function() {
                            if (res.aborted) {
                                return false;
                            };

                            if (cstep < mstep) {
                                res.cork(async function() {
                                    try {
                                        return await callbacks[cstep++](res, req, next);
                                    } catch (err) {
                                        console.log(`err from http callback -> `, err);

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
