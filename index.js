const config = require(`${process.cwd()}/config.json`);

const uws = require(`uWebSockets.js`);
const crypto = require(`crypto`);

const cache = require(`./dist/core/cache`);
const mysql = require(`./dist/core/mysql`);
const logger = require(`./dist/core/logger`);
const session = require(`./dist/core/session`);
const validator = require(`./dist/core/validator`);


let app = uws.App();


app.options(`/*`, function(res, req) {
    const origin = req.getHeader(`origin`);
    let headers = `content-type, content-length, host, user-agent, accept, accept-encoding, connection, cache-control, cookie, session, cf-connecting-ip, cf-ipcountry, challenge`;

    res.writeHeader(`Vary`, `Origin`);
    res.writeHeader(`Content-Length`, `0`);
    res.writeHeader(`Access-Control-Allow-Methods`, `GET,POST,PATCH,DELETE`);

    if (config.cors) {
        if (config.cors.origin && config.cors.origin.includes(origin)) {
            res.writeHeader(`Access-Control-Allow-Origin`, origin);
        };

        if (config.cors.headers) {
            for (const header of config.cors.headers) {
                headers += `, ${header}`;
            };
        };

        res.writeHeader(`Access-Control-Allow-Headers`, headers);

        if (config.cors.credentials) {
            res.writeHeader(`Access-Control-Allow-Credentials`, `true`);
        };
    };

    return res.end();
});

for (const method of [`get`, `post`, `patch`, `del`]) {
    app[`__${method}`] = app[method].bind(app);

    app[method] = function(url, options, callback) {
        app[`__${method}`](url, async function (res, req) {
            res.headers = [];
    
            res.onAborted(function () {
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
    
            req.headers = {
                origin: req.getHeader(`origin`),
                cookie: req.getHeader(`cookie`),
                session: req.getHeader(`session`),
                challenge: req.getHeader(`challenge`),
                content_type: req.getHeader(`content-type`),
                country: req.getHeader(`cf-ipcountry`) || `??`,
                ip: req.getHeader(`cf-connecting-ip`) || `127.0.0.1`
            };
    
            if (config.cors.headers) {
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
                    payload: true,
                    ...options.log
                },
                turnstile: options.turnstile || false,
                limit: {
                    attempts: 15,
                    per: 10,
                    ...options.limit
                }
            };

            if (req.options.limit) {
                const cache_key = `http_limit:url=${req.url}-ip=${req.headers.ip}`;
        
                let remaining = cache.get(cache_key);
            
                if (remaining !== null) {
                    if (remaining < 1) {
                        return res.send({
                            error: `ER_RATE_LIMIT`,
                            message: `${req.options.limit.attempts} attempts per ${req.options.limit.per} seconds`
                        }, 429);
                    };
            
                    remaining--;
                };
            
                cache.set([cache_key], remaining === null ? req.options.limit.attempts - 1 : remaining, req.options.limit.per);
            };

            if (config.cloudflare && req.options.turnstile) {
                if (!req.headers.challenge) {
                    return res.send({
                        error: `ER_INV_DATA`,
                        message: `turnstile is invalid > header 'challenge' is missing`
                    }, 400);
                };

                let form = new FormData();
                    form.append(`secret`, config.cloudflare.turnstile.secret_key);
                    form.append(`response`, req.headers.challenge);
                    form.append(`remoteip`, req.headers.ip);

                const request = await fetch(`https://challenges.cloudflare.com/turnstile/v0/siteverify`, {
                    method: `POST`,
                    body: form
                });
            
                if (request.status != 200) {
                    logger.log(`[HTTP TURNSTILE] [FAILED] [${req.method}] [${req.url}] [${req.headers.ip}] [${request.status}]`);

                    return res.send({
                        error: `ER_INV_DATA`,
                        message: `turnstile is invalid > challenge is failed`
                    }, 400);
                };
            
                const response = await request.json();
            
                if (!response.success) {
                    logger.log(`[HTTP TURNSTILE] [FAILED] [${req.method}] [${req.url}] [${req.headers.ip}] [${request[`error-codes`]}]`);

                    return res.send({
                        error: `ER_INV_DATA`,
                        message: `turnstile is invalid > challenge is failed`
                    }, 400);
                };

                logger.log(`[HTTP TURNSTILE] [SUCCESS] [${req.method}] [${req.url}] [${req.headers.ip}]`);
            };

            if (config.session && req.options.auth.required !== 0) {
                req.session = await session.get(res, req);

                if (req.session) {
                    req.session.account = cache.get(`accounts:id=${req.session.id}`) || await mysql.exe(`SELECT * FROM accounts WHERE id = ?`, [req.session.id]);
            
                    if (req.session.account) {
                        cache.set([`accounts:id=${req.session.id}`], req.session.account);
                    } else {
                        await session.close(res, req);
            
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

            if (req.options.schema?.params) {
                req.params = [];

                for (let i = 0; i < req.options.schema.params.length; i++) {
                    const param = req.getParameter(i);

                    if (!param) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: `parameter[${i}] is missing`
                        }, 400);
                    };

                    if (!validator.value(param, req.options.schema.params[i])) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: `parameter[${i}] is invalid > ${validator.error()}`
                        }, 400);
                    };

                    req.params.push(param);
                };
            };

            if (req.options.schema?.query) {
                const string = req.getQuery();

                if (string) {
                    req.query = {};

                    const pairs = string.split(`&`);
    
                    if (req.options.schema.query.max && pairs.length > req.options.schema.query.max) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: `query string is invalid > 'length < ${req.options.schema.query.max}' required`
                        }, 400);
                    };
        
                    if (req.options.schema.query.min && pairs.length < req.options.schema.query.min) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: `query string is invalid > '${req.options.schema.query.min} < length' required`
                        }, 400);
                    };
        
                    for (const pair of pairs) {
                        const [key, value] = pair.split(`=`);
                        req.query[key] = value;
                    };

                    if (!validator.json(req.query, req.options.schema.query)) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: `query string is invalid > ${validator.error()}`
                        }, 400);
                    };
                } else {
                    if (req.options.schema.query.min) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: `query string is missing`
                        }, 400);
                    };
        
                    for (const property of Object.values(req.options.schema.query.properties)) {
                        if (property.required) {
                            return res.send({
                                error: `ER_INV_DATA`,
                                message: `query string is missing`
                            }, 400);
                        };
                    };
                };
            };

            const finish = function() {
                if (req.options.schema && req.options.log.payload) {
                    logger.log(`[HTTP] [${req.method}] [${req.url}] [${req.headers.ip}] [${req.session?.account.id || `NULL`}] [${JSON.stringify({
                        params: req.params, query: req.query, body: req.body
                    })}]`);
                } else {
                    logger.log(`[HTTP] [${req.method}] [${req.url}] [${req.headers.ip}] [${req.session?.account.id || `NULL`}]`);
                };

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

            if (!req.options.schema?.body) {
                return finish();
            };

            req.raw = ``;
            req.body = {};

            res.onData(function(ab, last) {
                const chunk = Buffer.from(ab);

                if (req.raw) {
                    req.raw = Buffer.concat([req.raw, chunk]);
                } else {
                    req.raw = Buffer.concat([chunk]);
                };

                if (last) {
                    if (req.options.schema.body.json) {
                        if ((req.headers.content_type === `application/json` || req.headers.content_type === `application/json; charset=utf-8`) && req.raw.length > 0) {
                            try {
                                req.body.json = JSON.parse(req.raw);
                            } catch (err) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: `body raw is invalid`
                                }, 400);
                            };
            
                            const length = Object.keys(req.body.json).length;
            
                            if (req.options.schema.body.json.max && length > req.options.schema.body.json.max) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: `body raw is invalid > 'length < ${req.options.schema.query.max}' required`
                                }, 400);
                            };
                
                            if (req.options.schema.body.json.min && length < req.options.schema.body.json.min) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: `body raw is invalid > '${req.options.schema.query.min} < length' required`
                                }, 400);
                            };
            
                            if (!validator.json(req.body.json, req.options.schema.body.json)) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: `body raw is invalid > ${validator.error()}`
                                }, 400);
                            };
                        } else {
                            if (req.options.schema.body.json.min) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: `body raw is missing`
                                }, 400);
                            };
        
                            for (const property of Object.values(req.options.schema.body.json.properties)) {
                                if (property.required) {
                                    return res.send({
                                        error: `ER_INV_DATA`,
                                        message: `body raw is missing`
                                    }, 400);
                                };
                            };
                        };
                    } else if (req.options.schema.body.form) {
                        if (req.headers.content_type.search(`multipart/form-data`) > -1 && req.raw.length > 0) {
                            const parts = uws.getParts(req.raw, req.headers.content_type);
        
                            if (req.options.schema.body.form.max && parts.length > req.options.schema.body.form.max) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: `multipart is invalid > 'length < ${req.options.schema.query.max}' required`
                                }, 400);
                            };
                
                            if (req.options.schema.body.form.min && parts.length < req.options.schema.body.form.min) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: `multipart is invalid > '${req.options.schema.query.min} < length' required`
                                }, 400);
                            };
            
                            for (const [key, property] of Object.entries(req.options.schema.body.form.properties)) {
                                if (property.required && parts.findIndex(function(x) { return key === x.name }) < 0) {
                                    return res.send({
                                        error: `ER_INV_DATA`,
                                        message: `multipart is invalid > '${key}' is missing`
                                    }, 400);
                                };
                            };
            
                            req.body.form = {};
            
                            for (const part of parts) {
                                if (!req.options.schema.body.form.properties[part.name]) {
                                    return res.send({
                                        error: `ER_INV_DATA`,
                                        message: `multipart is invalid > '${part.name}' is not required`
                                    }, 400);
                                };

                                if (typeof part.filename === `undefined`) {
                                    if (req.options.schema.body.form.properties[part.name].type === `file`) {
                                        return res.send({
                                            error: `ER_INV_DATA`,
                                            message: `multipart is invalid > '${part.name}' is invalid > file required`
                                        }, 400);
                                    };
            
                                    const value = req.raw.from(part.data).toString();
            
                                    if (!validator.value(value, req.options.schema.body.form.properties[part.name])) {
                                        return res.send({
                                            error: `ER_INV_DATA`,
                                            message: validator.error()
                                        }, 400);
                                    };
            
                                    if (req.body.form[part.name]) {
                                        return res.send({
                                            error: `ER_INV_DATA`,
                                            message: `multipart is invalid > '${part.name}' is invalid > duplicated`
                                        }, 400);
                                    };
            
                                    req.body.form[part.name] = value;
                                } else {
                                    if (req.options.schema.body.form.properties[part.name].type !== `file`) {
                                        return res.send({
                                            error: `ER_INV_DATA`,
                                            message: `multipart is invalid > '${part.name}' is invalid > not a file required`
                                        }, 400);
                                    };

                                    if (part.filename.length < 1) {
                                        return res.send({
                                            error: `ER_INV_DATA`,
                                            message: `multipart is invalid > '${part.name}' is invalid > file is invalid`
                                        }, 400);
                                    };
                
                                    if (part.data.byteLength > req.options.schema.body.form.properties[part.name].size) {
                                        return res.send({
                                            error: `ER_INV_DATA`,
                                            message: `multipart is invalid > '${part.name}' is invalid > 'file size < ${req.options.schema.body.form.properties[part.name].size} b' required`
                                        }, 400);
                                    };
                
                                    if (!req.options.schema.body.form.properties[part.name].mimetypes.includes(part.type)) {
                                        return res.send({
                                            error: `ER_INV_DATA`,
                                            message: `multipart is invalid > '${part.name}' is invalid > '${req.options.schema.body.form.properties[part.name].mimetypes.join(` / `)}' mimetype required`
                                        }, 400);
                                    };
                
                                    const mimetypes = {
                                        [`image/png`]: `png`,
                                        [`image/jpeg`]: `jpg`,
                                        [`image/webp`]: `webp`,
                                        [`image/gif`]: `gif`,
                                        [`image/svg+xml`]: `svg`,
                                        [`application/zip`]: `zip`,
                                        [`application/zip-compressed`]: `zip`,
                                        [`application/x-zip-compressed`]: `zip`,
                                        [`video/mp4`]: `mp4`
                                    };
                
                                    let file = {
                                        name: part.filename,
                                        mimetype: part.type,
                                        ext: mimetypes[part.type],
                                        size: part.data.byteLength,
                                        buffer: Buffer.from(part.data)
                                    };
                
                                    if (req.options.schema.body.form.properties[part.name].hash) {
                                        file.hash = crypto.createHash(`md5`).update(file.buffer).digest(`hex`);
                                    };
                
                                    if (req.body.form[part.name]) {
                                        if (Array.isArray(req.body.form[part.name])) {
                                            if (req.body.form[part.name].length >= req.options.schema.body.form.properties[part.name].max) {
                                                return res.send({
                                                    error: `ER_INV_DATA`,
                                                    message: `multipart is invalid > '${part.name}' is invalid > 'length < ${req.options.schema.body.form.properties[part.name].max}' required`
                                                }, 400);
                                            };
                
                                            req.body.form[part.name].push(file)
                                        } else {
                                            req.body.form[part.name] = [req.body.form[part.name], file];
                                        };
                
                                        continue;
                                    };
                
                                    req.body.form[part.name] = file;
                                };
                            };
                        } else {
                            if (req.options.schema.body.form.min) {
                                return res.send({
                                    error: `ER_INV_DATA`,
                                    message: `multipart is missing`
                                }, 400);
                            };
                            
                            for (const property of Object.values(req.options.schema.body.form.properties)) {
                                if (property.required) {
                                    return res.send({
                                        error: `ER_INV_DATA`,
                                        message: `multipart is missing`
                                    }, 400);
                                };
                            };
                        };
                    };

                    return finish();
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
        log: {
            payload: true,
            ...options.log
        },
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
                        req.session = await session.get(res, req);
        
                        if (req.session) {
                            req.session.account = cache.get(`accounts:id=${req.session.id}`) || await mysql.exe(`SELECT * FROM accounts WHERE id = ?`, [req.session.id]);
                    
                            if (req.session.account) {
                                cache.set([`accounts:id=${req.session.id}`], req.session.account);
                            } else {
                                await session.close(res, req);
                    
                                return res.send({
                                    error: `ER_SESSION_RELOAD_NEEDED`
                                }, 400);
                            };
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
                    message = isBinary ? message.split(`::`) : Buffer.from(message).toString().split(`::`);
        
                    ws.message = {
                        ident: message[0],
                        action: message[1],
                        data: message[2] || null
                    };
        
                    if (!ws.message.ident || !validator.value(ws.message.ident, { type: `uint`, min: 0, max: 1e10 })) {
                        return ws.send({
                            error: `ER_INV_DATA`,
                            message: `ident is invalid > ${validator.error()}`
                        }, 2);
                    };
        
                    if (!ws.message.action || !validator.value(ws.message.action, { type: `string`, min: 1, max: 128 })) {
                        return ws.send({
                            error: `ER_INV_DATA`,
                            message: `action is invalid > ${validator.error()}`
                        }, 2);
                    };
        
                    if (ws.message.data) {
                        try {
                            ws.message.data = JSON.parse(ws.message.data);
                        } catch (err) {
                            return ws.send({
                                error: `ER_INV_DATA`,
                                message: `data is invalid`
                            }, 2);
                        };
                    };
                    
                    const callback = app.ws_actions[url][ws.message.action];
        
                    if (!callback) {
                        return ws.send({
                            error: `ER_INV_DATA`,
                            message: `action not found`
                        }, 2);
                    };
        
                    if (callback.options.limit) {
                        const cache_key = `ws_limit:url=${url}-action=${ws.message.action}-ip=${ws.headers.ip}`;
            
                        let remaining = cache.get(cache_key);
                    
                        if (remaining !== null) {
                            if (remaining < 1) {
                                ws.send({
                                    error: `ER_RATE_LIMIT`,
                                    message: `${callback.options.limit.attempts} attempts per ${callback.options.limit.per} seconds`
                                }, 3);
                
                                return ws.end();
                            };
                    
                            remaining--;
                        };
                    
                        cache.set([cache_key], remaining === null ? callback.options.limit.attempts - 1 : remaining, callback.options.limit.per);
                    };
        
                    if (callback.options.auth && callback.options.auth.required !== 0) {
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
        
                    if (callback.options.schema) {
                        if (!ws.message.data) {
                            if (callback.options.schema.min) {
                                return ws.send({
                                    error: `ER_INV_DATA`,
                                    message: `data is missing`
                                }, 2);
                            };
        
                            for (const properties of Object.values(callback.options.schema.properties)) {
                                if (properties.required) {
                                    return ws.send({
                                        error: `ER_INV_DATA`,
                                        message: `data is missing`
                                    }, 2);
                                };
                            };
                        };
        
                        if (!validator.json(ws.message.data, callback.options.schema)) {
                            return ws.send({
                                error: `ER_INV_DATA`,
                                message: `data is invalid > ${validator.error()}`
                            }, 2);
                        };
                    };
        
                    logger.log(`[WS MESSAGE] [${url}] [${ws.message.action}] [${ws.headers.ip}] [${ws.session.account.id || `NULL`}] [${JSON.stringify(ws.message.data)}]`);
                    
                    try {
                        return await app.ws_actions[url][ws.message.action].callback(ws, ws.message.data);
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
    core: {
        cache: require(`./dist/core/cache`),
        cookie: require(`./dist/core/cookie`),
        error: require(`./dist/core/error`),
        logger: require(`./dist/core/logger`),
        mysql: require(`./dist/core/mysql`),
        password: require(`./dist/core/password`),
        redis: require(`./dist/core/redis`),
        session: require(`./dist/core/session`),
        utils: require(`./dist/core/utils`),
        validator: require(`./dist/core/validator`),
    },
    mail: {
        mailgun: require(`./dist/mail/mailgun`)
    },
    payment: {
        coinbase: require(`./dist/payment/coinbase`),
        cryptomus: require(`./dist/payment/cryptomus`),
        sellix: require(`./dist/payment/sellix`),
        stripe: require(`./dist/payment/stripe`),
    },
    social: {
        discord: require(`./dist/social/discord`),
        google: require(`./dist/social/google`),
        telegram: require(`./dist/social/telegram`)
    }
};