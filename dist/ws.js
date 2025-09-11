const config = require(`${process.cwd()}/config.json`);

const parser = require(`./parser`);
const logger = require(`./logger`);


module.exports = function(app) {
    app[`_ws`] = app.ws.bind(app);

    app.ws = {
        routes: {},
        connections: {},
        messages: {}
    };

    if (config.guard) {
        setInterval(() => {
            app.ws.messages = {};
        }, config.guard.ws[1][1] * 1000);
    };

    app.message = function(url, options, handler) {
        app.ws.routes[url] = {
            config: {
                guard: options.config?.guard !== undefined ? options.config.guard : null,
                log: {
                    headers: options.config?.log?.headers !== undefined ? options.config.log?.headers : false,
                    payload: options.config?.log?.payload !== undefined ? options.config.log?.payload : true,
                    messages: options.config?.log?.messages !== undefined ? options.config.log?.messages : false,
                    connections: options.config?.log?.connections !== undefined ? options.config.log?.connections : true
                }
            },
            schema: options.schema || null,
            handlers: {
                upgrade: (options.middlewares?.upgrade || []).reverse(),
                message: (options.middlewares?.message || []).concat(handler).reverse()
            },
            connections: {},
            messages: {}
        };

        if (app.ws.routes[url].config.guard) {
            setInterval(() => {
                app.ws.routes[url].messages = {};
            }, app.ws.routes[url].config.guard[1][1] * 1000);
        };

        app._ws(url, {
            idleTimeout: 10,
            maxBackpressure: 1024,
            maxPayloadLength: 512,

            open: function(ws) {
                console.log(`ws debug: + ws connected`);
                
                if (config.guard) {
                    if (app.ws.connections[ws.user.ip] === undefined) {
                        app.ws.connections[ws.user.ip] = 1;
                    } else {
                        app.ws.connections[ws.user.ip]++;
                    };
                };

                if (ws.config?.guard) {
                    if (app.ws.routes[ws.url].connections[ws.user.ip] === undefined) {
                        app.ws.routes[ws.url].connections[ws.user.ip] = 1;
                    } else {
                        app.ws.routes[ws.url].connections[ws.user.ip]++;
                    };
                };

                console.log(`ws debug: global connections: `, app.ws.connections);
                console.log(`ws debug: route connections: `, app.ws.routes[ws.url].connections);
            },

            close: function(ws, code, message) {
                console.log('ws debug: - ws closed');

                if (config.guard) {
                    if (app.ws.connections[ws.user.ip] !== undefined) {
                        if (app.ws.connections[ws.user.ip] > 1) {
                            app.ws.connections[ws.user.ip]--;
                        } else {
                            delete app.ws.connections[ws.user.ip];
                        };
                    };
                };

                if (ws.config?.guard) {
                    if (app.ws.routes[ws.url].connections[ws.user.ip] !== undefined) {
                        if (app.ws.routes[ws.url].connections[ws.user.ip] > 1) {
                            app.ws.routes[ws.url].connections[ws.user.ip]--;
                        } else {
                            delete app.ws.routes[ws.url].connections[ws.user.ip];
                        };
                    };
                };

                console.log(`ws debug: global connections: `, app.ws.connections);
                console.log(`ws debug: route connections: `, app.ws.routes[ws.url].connections);
            },

            upgrade: async function(res, req, context) {
                res.onAborted(function() {
                    res.aborted = true;
                });

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

                req.url = url;

                req.config = app.ws.routes[url].config;
                req.schema = app.ws.routes[url].schema;

                req.headers = {
                    "origin": req.getHeader(`origin`),
                    "content-type": req.getHeader(`content-type`),
                    "sec-websocket-key": req.getHeader(`sec-websocket-key`),
                    "sec-websocket-protocol": req.getHeader(`sec-websocket-protocol`),
                    "sec-websocket-extensions": req.getHeader(`sec-websocket-extensions`),
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

                if (app.ws.connections[req.user.ip] > config.guard.ws[0]) {
                    return res.send({
                        error: `ER_RATE_LIMIT`,
                        message: `${config.guard.ws[0]} connections`
                    }, 429);
                };

                if (app.ws.routes[req.url].connections[req.user.ip] > req.config.guard[0]) {
                    return res.send({
                        error: `ER_RATE_LIMIT`,
                        message: `${req.config.guard[0]} connections`
                    }, 429);
                };

                if (config.logger) {
                    let logText = `ws:connection > ${req.user.ip} > ${req.url}`;

                    if (req.config?.log?.headers) {
                        logText += ` > headers: ${JSON.stringify(req.headers)}`;
                    };

                    logger.log(logText);
                };

                if (app.ws.routes[url].handlers?.upgrade) {
                    let steps = app.ws.routes[url].handlers.upgrade.length - 1;

                    const next = function() {
                        if (res.aborted) {
                            return false;
                        };

                        if (steps >= 0) {
                            res.cork(async function() {
                                try {
                                    return await app.ws.routes[url].handlers.upgrade[steps--](res, req, next);
                                } catch (err) {
                                    console.log(`ws debug: err from ws upgrade handler -> `, err);

                                    return res.send({
                                        error: err.code || `ER_UNEXPECTED`,
                                        ...err.extra
                                    }, err.status || 500);
                                };
                            });
                        };
                    };

                    next();
                };

                if (res.aborted) {
                    return false;
                };

                return res.cork(function() {
                    res.upgrade(
                        {
                            url: req.url,
                            headers: req.headers,
                            config: req.config,
                            schema: req.schema,
                            user: req.user
                        },

                        req.headers[`sec-websocket-key`],
                        req.headers[`sec-websocket-protocol`],
                        req.headers[`sec-websocket-extensions`],

                        context
                    );
                });
            },

            message: async function(ws, message, isBinary) {
                ws.message = isBinary ? message : Buffer.from(message).toString();

                if (config.guard) {
                    if (app.ws.messages[ws.user.ip] === undefined) {
                        app.ws.messages[ws.user.ip] = 1;
                    } else {
                        app.ws.messages[ws.user.ip]++;
                    };

                    if (app.ws.messages[ws.user.ip] > config.guard.ws[1][0]) {
                        return ws.send(JSON.stringify({
                            error: `ER_RATE_LIMIT`,
                            message: `${config.guard.ws[1][0]} attempts per ${config.guard.ws[1][1]} seconds`
                        }));
                    };
                };

                if (ws.config?.guard) {
                    if (app.ws.routes[ws.url].messages[ws.user.ip] === undefined) {
                        app.ws.routes[ws.url].messages[ws.user.ip] = 1;
                    } else {
                        app.ws.routes[ws.url].messages[ws.user.ip]++;
                    };

                    if (app.ws.routes[ws.url].messages[ws.user.ip] > ws.config.guard[1][0]) {
                        return ws.send(JSON.stringify({
                            error: `ER_RATE_LIMIT`,
                            message: `${ws.config.guard[1][0]} attempts per ${ws.config.guard[1][1]} seconds on this route`
                        }));
                    };
                };

                if (ws.schema) {
                    ws.message = parser.message(ws);

                    if (ws.message.error) {
                        return ws.send(JSON.stringify({
                            error: `ER_INV_DATA`,
                            message: ws.message.error
                        }));
                    };
                };

                if (config.logger) {
                    let logText = `ws:message > ${ws.user.ip} > ${ws.url}`;

                    if (ws.config?.log?.payload && ws.schema) {
                        logText += ` > payload: ${JSON.stringify({ message: ws.message })}`;
                    };

                    logger.log(logText);
                };

                let steps = app.ws.routes[url].handlers.message.length - 1;

                console.log(`ws debug: + message received`);
                console.log(`ws debug: global messages: `, app.ws.messages);
                console.log(`ws debug: route messages: `, app.ws.routes[url].messages);

                const next = async function() {
                    if (steps >= 0) {
                        try {
                            return await app.ws.routes[url].handlers.message[steps--](ws, next);
                        } catch (err) {
                            console.log(`ws debug: err from ws message handler -> `, err);

                            return ws.send(JSON.stringify({
                                error: err.code || `ER_UNEXPECTED`,
                                ...err.extra
                            }));
                        };
                    };
                };

                return next();
            }
        });
    };
};