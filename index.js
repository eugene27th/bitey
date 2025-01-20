const config = require(`${process.cwd()}/config.json`);

const uws = require(`uWebSockets.js`);

const parser = require(`./dist/parser`);
const logger = require(`./dist/logger`);
const limiter = require(`./dist/limiter`);
const session = require(`./dist/session`);
const challenge = require(`./dist/challenge`);


let app = uws.App();


app.options(`/*`, function(res, req) {
    const origin = req.getHeader(`origin`);

    res.writeHeader(`Vary`, `Origin`);
    res.writeHeader(`Content-Length`, `0`);
    res.writeHeader(`Access-Control-Allow-Methods`, `GET,POST,PATCH,DELETE`);

    if (config.cors) {
        if (config.cors.origin && config.cors.origin.includes(origin)) {
            res.writeHeader(`Access-Control-Allow-Origin`, origin);
        };

        if (config.cors.headers) {
            res.writeHeader(`Access-Control-Allow-Headers`, config.cors.headers.join(`,`));
        };

        if (config.cors.credentials) {
            res.writeHeader(`Access-Control-Allow-Credentials`, `true`);
        };
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

            if (config.cors?.headers) {
                for (const header of config.cors.headers) {
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
                log: {
                    body: true,
                    ...options.log
                },
                turnstile: options.turnstile || false,
                raw: options.raw || false,
                limit: {
                    attempts: 15,
                    per: 10,
                    ...options.limit
                }
            };

            if (!limiter.allowed(`http_limit:url=${req.url}-ip=${req.headers[`cf-connecting-ip`]}`, req.options.limit.attempts, req.options.limit.per)) {
                return res.send({
                    error: `ER_RATE_LIMIT`,
                    message: `${req.options.limit.attempts} attempts per ${req.options.limit.per} seconds`
                }, 429);
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


app.ws_actions = {};
app.__publish = app.publish.bind(app);

app.publish = function(topic, action, data) {
    if (typeof data === `object`) {
        data = JSON.stringify(data);
    };

    return app.__publish(topic, `0::1::${action}${data ? `::${data}` : ``}`);
};

app.action = function(url, action, options, callback) {
    options = {
        auth: {
            required: 1,
            permissions: [],
            ...options.auth
        },
        schema: options.schema,
        limit: {
            attempts: 30,
            per: 60,
            ...options.limit
        }
    };

    if (app.ws_actions[url]) {
        app.ws_actions[url][action] = { options, callback };
    } else {
        app.ws_actions[url] = { [action]: { options, callback } };
    };
};

app.start = function() {
    if (Object.keys(app.ws_actions).length > 0) {
        for (const url of Object.keys(app.ws_actions)) {
            app.ws(url, {
                idleTimeout: 10,
                maxBackpressure: 1024,
                maxPayloadLength: 512,

                open: function(ws) {
                    ws.__send = ws.send.bind(ws);

                    ws.send = function(data, status = 1) {
                        if (typeof data === `object`) {
                            data = JSON.stringify(data);
                        };

                        return ws.__send(`${ws.message?.ident ? `${ws.message?.ident}::` : `-1::`}${status}${ws.message?.action ? `::${ws.message?.action}` : ``}${data ? `::${data}` : ``}`);
                    };

                    ws.message = {
                        ident: `0`,
                        action: `connected`
                    };

                    logger.log(`[WS CONNECTED] [${url}] [${ws.headers.ip}]`);

                    return ws.send();
                },

                upgrade: async function(res, req, context) {
                    res.onAborted(function() {
                        res.aborted = true;
                    });

                    res.send = function(data, status = 200) {
                        if (res.aborted) {
                            return false;
                        };

                        res.cork(function() {
                            res.writeStatus(`${status}`);

                            if (typeof data === `undefined` || data === true) {
                                return res.end();
                            };

                            if (typeof data === `object`) {
                                res.writeHeader(`Content-Type`, `application/json`);
                                return res.end(JSON.stringify(data));
                            };

                            res.end(data);
                        });
                    };

                    req.headers = {
                        cookie: req.getHeader(`cookie`),
                        session: req.getHeader(`session`),
                        challenge: req.getHeader(`challenge`),
                        country: req.getHeader(`cf-ipcountry`) || `??`,
                        ip: req.getHeader(`cf-connecting-ip`) || `127.0.0.1`,
                        wskey: req.getHeader(`sec-websocket-key`),
                        wsprotocol: req.getHeader(`sec-websocket-protocol`),
                        wsextensions: req.getHeader(`sec-websocket-extensions`)
                    };

                    if (config.session) {
                        req.session = await session.get.cookies(req.headers.cookie || req.headers.session || req.headers.wsprotocol);

                        if (req.session && config.session.termination_new_ip && req.session.ip !== req.headers[`cf-connecting-ip`]) {
                            req.session = null; await session.close(req.session.key);
                        };

                        if (!req.session) {
                            return res.send({
                                error: `ER_SESSION_REQUIRED`
                            }, 403);
                        };

                        req.session.account = await session.account.get(`id`, req.session.id);

                        if (!req.session.account) {
                            await session.close(req.session.key);

                            return res.send({
                                error: `ER_SESSION_RELOAD_NEEDED`
                            }, 400);
                        };
                    };

                    if (res.aborted) {
                        return false;
                    };

                    return res.cork(function() {
                        res.upgrade(
                            {
                                session: req.session,
                                headers: req.headers
                            },

                            req.headers.wskey,
                            req.headers.wsprotocol,
                            req.headers.wsextensions,

                            context
                        );
                    });
                },

                message: async function(ws, message, isBinary) {
                    ws.message = parser.message(message, isBinary);

                    if (ws.message.error) {
                        return ws.send({
                            error: `ER_INV_DATA`,
                            message: ws.message.error
                        }, 2);
                    };

                    const action = app.ws_actions[url][ws.message.action];

                    if (!limiter.allowed(`ws_limit:url=${url}-action=${ws.message.action}-ip=${ws.headers.ip}`, callback.options.limit.attempts, callback.options.limit.per)) {
                        return ws.send({
                            error: `ER_RATE_LIMIT`,
                            message: `${callback.options.limit.attempts} attempts per ${callback.options.limit.per} seconds`
                        }, 3);
                    };

                    if (config.session && callback.options.auth && callback.options.auth.required !== 0) {
                        if (callback.options.auth.required === 2 && ws.session) {
                            return ws.send({
                                error: `ER_ALR_AUTH`
                            }, 2);
                        };

                        if (!ws.session) {
                            return ws.send({
                                error: `ER_NOT_AUTH`
                            }, 2);
                        };

                        if (callback.options.auth.permissions.length > 0 && !callback.options.auth.permissions.includes(ws.session.account.permission)) {
                            return ws.send({
                                error: `ER_ACS_DENIED`
                            }, 2);
                        };
                    };

                    logger.log(`[WS MESSAGE] [${url}] [${ws.message.action}] [${ws.headers.ip}] [${ws.session.account.id || `NULL`}] [${JSON.stringify(ws.message.data)}]`);

                    try {
                        return await action.callback(ws, ws.message.data);
                    } catch (err) {
                        console.log(`err from ws message -> `, err);

                        return ws.send({
                            error: err.code || `ER_UNEXPECTED`,
                            ...err.extra
                        }, 2);
                    };
                }
            });
        };
    };

    app.listen(config.port, function(token) {
        token ? console.log(`[BITEY] [INFO] uWS started on port: ${config.port}.`) : console.log(`[BITEY] [ERROR] uWS not started.`);
    });
};


module.exports = {
    app,
    cache: require(`./dist/cache`),
    cookie: require(`./dist/cookie`),
    error: require(`./dist/error`),
    logger: require(`./dist/logger`),
    mysql: require(`./dist/mysql`),
    password: require(`./dist/password`),
    redis: require(`./dist/redis`),
    session: require(`./dist/session`),
    utils: require(`./dist/utils`),
    validator: require(`./dist/validator`)
};