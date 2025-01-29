const config = require(`${process.cwd()}/config.json`);

const guard = require(`./guard`);
const parser = require(`./parser`);
const logger = require(`./logger`);
const session = require(`./session`);
const challenge = require(`./challenge`);


module.exports = function(app) {
    app.options(`/*`, function(res, req) {
        const origin = req.getHeader(`origin`);

        res.writeHeader(`Vary`, `Origin`);
        res.writeHeader(`Content-Length`, `0`);
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

                if (config.headers) {
                    for (const header of config.headers) {
                        req.headers[header] = req.getHeader(header);
                    };
                };

                req.options = {
                    auth: {
                        required: 1,
                        permissions: [],
                        ...options.auth
                    },
                    schema: options.schema,
                    raw: options.raw || false,
                    guard: options.guard || null,
                    turnstile: options.turnstile || false,
                    log_payload: options.log_payload || true
                };

                if (config.guard || req.options.guard) {
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

                        if (!req.options.raw && req.raw) {
                            delete req.raw;
                        };

                        if (config.cloudflare?.turnstile && req.options.turnstile) {
                            const result = await challenge.turnstile(req);

                            if (result.error) {
                                return res.send({
                                    error: result.error,
                                    message: result.message
                                }, 400);
                            };
                        };

                        if (config.session && req.options.auth.required !== 0) {
                            req.session = await session.get.cookies(req.headers.cookie || req.headers.session);

                            if (req.session && config.session.termination_new_ip && req.session.ip !== req.headers[`cf-connecting-ip`]) {
                                req.session = null; await session.close(req.session.key);
                            };

                            if (req.session) {
                                req.session.account = await session.account.get(`id`, req.session.id);

                                if (!req.session.account) {
                                    await session.close(req.session.key);

                                    return res.send({
                                        error: `ER_SESSION_RELOAD_NEEDED`
                                    }, 400);
                                };

                                if (req.options.auth.required === 2) {
                                    return res.send({
                                        error: `ER_ALR_AUTH`
                                    }, 400);
                                };

                                if (req.options.auth.permissions.length > 0 && !req.options.auth.permissions.includes(req.session.account.permission)) {
                                    return res.send({
                                        error: `ER_ACS_DENIED`
                                    }, 403);
                                };
                            } else if (req.options.auth.required === 1) {
                                return res.send({
                                    error: `ER_NOT_AUTH`
                                }, 401);
                            };
                        };

                        logger.http(req);

                        if (res.aborted) {
                            return false;
                        };

                        res.cork(async function() {
                            try {
                                return await callback(res, req);
                            } catch (err) {
                                console.log(`err from http callback -> `, err);

                                return res.send({
                                    error: err.code || `ER_UNEXPECTED`,
                                    ...err.extra
                                }, err.status || 500);
                            };
                        });
                    };
                });
            });
        };
    };
};
