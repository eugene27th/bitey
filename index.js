const config = require(`${process.cwd()}/config.json`);

const uws = require(`uWebSockets.js`);

const cache = require(`./dist/cache`);
const mysql = require(`./dist/mysql`);
const logger = require(`./dist/logger`);
const session = require(`./dist/session`);
const validator = require(`./dist/validator`);


const collector = function (res, cb, err) {
    let buffer;

    res.onData(function(ab, last) {
        let chunk = Buffer.from(ab);

        if (last) {
            if (buffer) {
                cb(Buffer.concat([buffer, chunk]));
            } else {
                cb(chunk);
            };
        } else {
            if (buffer) {
                buffer = Buffer.concat([buffer, chunk]);
            } else {
                buffer = Buffer.concat([chunk]);
            };
        };
    });
};

const parser = function(res, req, next) {
    if (!req.options.schema) {
        return next();
    };

    req.query = {};
    req.params = [];
    req.body = {};

    if (req.options.schema.query) {
        let query = req.getQuery();

        if (query) {
            let pairs = query.split(`&`);

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
                let [key, value] = pair.split(`=`);
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

    if (req.options.schema.params) {
        for (let i = 0; i < req.options.schema.params.length; i++) {
            let param = req.getParameter(i);

            if (!param) {
                return res.send({
                    error: `ER_INV_DATA`,
                    message: `parameter is missing`
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

    if (!req.options.schema.body) {
        return next();
    };

    collector(res,
        function (buffer) {
            req.raw = buffer;
            
            if (req.options.schema.body.json) {
                if (req.headers.content_type !== `application/json` || buffer.length < 1) {
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

                    return next();
                };

                try {
                    req.body.json = JSON.parse(buffer);
                } catch (err) {
                    return res.send({
                        error: `ER_INV_DATA`,
                        message: `body raw is invalid`
                    }, 400);
                };

                let length = Object.keys(req.body.json).length;

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

                return next();
            };

            if (req.options.schema.body.form) {
                if (req.headers.content_type.search(`multipart/form-data`) < 0 || buffer.length < 1) {
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

                    return next();
                };
                
                let parts = uws.getParts(buffer, req.headers.content_type);

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

                for (let [key, property] of Object.entries(req.options.schema.body.form.properties)) {
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

                        let value = Buffer.from(part.data).toString();

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

                        continue;
                    } else if (part.filename.length < 1 || req.options.schema.body.form.properties[part.name].type !== `file`) {
                        return res.send({
                            error: `ER_INV_DATA`,
                            message: `multipart is invalid > '${part.name}' is invalid > not a file required`
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

                    let mimetypes = {
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
                        file.hash = createHash(`md5`).update(file.buffer).digest(`hex`);
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

                return next();
            };

            return next();
        }
    );  
};

const auth = async function(res, req, next) {
    if (!config.session) {
        return next();
    };

    if (req.options.auth.required === 0) {
        return next();
    };

    req.session = await session.get(res, req);

    if (req.session) {
        req.session.account = cache.get(`account:id=${req.session.id}`) || await mysql.exe(`SELECT * FROM accounts WHERE id = ?`, [req.session.id]);

        if (req.session.account) {
            cache.set([`account:id=${req.session.id}`], account);
        } else {
            await session.close(res, req);

            return res.send({
                error: `ER_SESSION_RELOAD_NEEDED`
            }, 400);
        };
    };

    if (req.options.auth.required === 2) {
        if (req.session) {
            return res.send({
                error: `ER_ALR_AUTH`
            }, 400);
        } else {
            return next();
        };
    };

    if (!req.session) {
        return res.send({
            error: `ER_NOT_AUTH`
        }, 401);
    };

    if (req.session.account.permission === 0) {
        return res.send({
            error: `ER_ACCOUNT_FROZEN`
        }, 403);
    };

    if (req.options.auth.permissions.length > 0 && !req.options.auth.permissions.includes(req.session.account.permission)) {
        return res.send({
            error: `ER_ACS_DENIED`
        }, 403);
    };

    return next();
};

const log = async function(res, req, next) {
    let message = `[${req.method}] [${req.url}] [${req.headers.ip}]`;

    let data = {};

    if (req.session?.account.id) {
        data.account_id = req.session.account.id;
    };

    if (req.options.log.payload && req.options.schema) {
        if (req.options.schema.params) {
            data.params = req.params;
        };

        if (req.options.schema.query) {
            data.query = req.query;
        };

        if (req.options.schema.body) {
            data.body = req.body;
        };
    };

    message += ` [DATA: ${JSON.stringify(data)}]`;

    logger.log(`[REQUEST] ${message}`);

    return next();
};

const turnstile = async function(res, req, next) {
    if (!config.cloudflare) {
        return next();
    };

    if (config.cloudflare.blacklist && config.cloudflare.blacklist.includes(req.headers.ip)) {
        return res.send({
            error: `ER_ACS_DENIED`
        }, 403);
    };

    if (!req.options.turnstile || (config.cloudflare.whitelist && config.cloudflare.whitelist.includes(req.headers.ip))) {
        return next();
    };

    if (!req.headers.challenge) {
        return res.send({
            error: `ER_INV_DATA`,
            message: `'challenge' is invalid > header is missing`
        }, 400);
    };

    let form = new FormData();

    form.append(`secret`, config.cloudflare.turnstile.secret_key);
    form.append(`response`, req.headers.challenge);
    form.append(`remoteip`, req.headers.ip);

    const response = await fetch(`https://challenges.cloudflare.com/turnstile/v0/siteverify`, {
        method: `POST`,
        body: form
    });

    if (response.status != 200) {
        return res.send({
            error: `ER_INV_DATA`,
            message: `'challenge' is invalid > challenge is failed`
        }, 400);
    };

    const result = await response.json();

    if (!result.success) {
        return res.send({
            error: `ER_INV_DATA`,
            message: `'challenge' is invalid > challenge is failed`
        }, 400);
    };

    return next();
};


const http = function(method, url, options) {
    return async function (res, req) {
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
                } else if (typeof data === `undefined` || data === true) {
                    res.writeStatus(`204`);
                };

                if (config.cors?.origin && config.cors.origin.includes(req.headers.origin)) {
                    res.writeHeader(`Access-Control-Allow-Origin`, req.headers.origin);
                };

                res.writeHeader(`Access-Control-Allow-Credentials`, `true`);

                if (res.headers.length > 0) {
                    for (const [name, value] of res.headers) {
                        res.writeHeader(name, value);
                    };
                };

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
            let cache_key = `http_limit:url=${req.url}-ip=${req.headers.ip}`;
    
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


        let cur_step = 0;
        let max_steps = app.routes.http[method][url].methods.length;

        let next = function () {
            if (res.aborted) {
                return false;
            };
            
            if (cur_step < max_steps) {
                res.cork(async function() {
                    try {
                        return await app.routes.http[method][url].methods[cur_step++](res, req, next);
                    } catch (err) {
                        console.log(`err from http next -> `, err);

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
};

const ws = function(url) {
    return {
        idleTimeout: 10,
        maxBackpressure: 1024,
        maxPayloadLength: 512,
    
        open: function(ws) {
            ws.__send = ws.send.bind(ws);

            ws.send = function(data, status = 1) {
                if (typeof data === `object`) {
                    data = JSON.stringify(data);
                };

                return ws.__send(`${status}${ws.message?.action ? `::${ws.message?.action}` : ``}${data ? `::${data}` : ``}`);
            };

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
                sec_websocket_key: req.getHeader('sec-websocket-key'),
                sec_websocket_protocol: req.getHeader('sec-websocket-protocol'),
                sec_websocket_extensions: req.getHeader('sec-websocket-extensions')
            };

            let session = null;

            if (config.session) {
                session = await session.get(res, req);

                if (session) {
                    session.account = cache.get(`account:id=${session.id}`) || await mysql.exe(`SELECT * FROM accounts WHERE id = ?`, [session.id]);
            
                    if (session.account) {
                        cache.set([`account:id=${session.id}`], account);

                        if (session.account.permission === 0) {
                            return res.send({
                                error: `ER_ACCOUNT_FROZEN`
                            }, 403);
                        };
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
                        session: session,
                        headers: req.headers
                    },
                    
                    req.headers.sec_websocket_key,
                    req.headers.sec_websocket_protocol,
                    req.headers.sec_websocket_extensions,
    
                    context
                );
            });
        },
    
        message: async function(ws, message, isBinary) {
            message = isBinary ? message.split(`::`) : Buffer.from(message).toString().split(`::`);

            ws.message = {
                action: message[0],
                data: message[1] || null
            };

            if (!ws.message.action || !validator.value(ws.message.action, { type: `pat_string_safe`, min: 1, max: 128 })) {
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
            
            const callback = app.routes.ws[url][ws.message.action];

            if (!callback) {
                return ws.send({
                    error: `ER_INV_DATA`,
                    message: `action not found`
                }, 2);
            };

            if (callback.options.limit) {
                let cache_key = `ws_limit:url=${url}-action=${ws.message.action}-ip=${ws.headers.ip}`;
    
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

                if (ws.session.account.permission === 0) {
                    return ws.send({
                        error: `ER_ACCOUNT_FROZEN`
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
            
            
            try {
                return await app.routes.ws[url][ws.message.action].function(ws, ws.message.data);
            } catch (err) {
                console.log(`err from ws message -> `, err);

                return ws.send({
                    error: err.code || `ER_UNEXPECTED`,
                    ...err.extra
                }, 2);
            };
        }
    };
};


let app = uws.App();

app.routes = {
    http: {
        [`get`]: {},
        [`post`]: {},
        [`patch`]: {},
        [`del`]: {}
    },
    ws: {}
};

app.options(`/*`, function(res, req) {
    let origin = req.getHeader(`origin`);
    let headers = `content-type, content-length, host, user-agent, accept, accept-encoding, connection, cache-control, cookie, session, cf-connecting-ip, cf-ipcountry`;

    res.writeHeader(`Vary`, `Origin`);
    res.writeHeader(`Content-Length`, `0`);
    res.writeHeader(`Access-Control-Allow-Methods`, `GET,POST,PATCH,DELETE`);

    if (config.cors) {
        if (config.cors.origin.includes(origin)) {
            res.writeHeader(`Access-Control-Allow-Origin`, origin);
        };

        if (config.cors.headers) {
            for (const header of config.cors.headers) {
                headers += `, ${header}`;
            };
        };

        res.writeHeader(`Access-Control-Allow-Headers`, headers);

        if (config.cors.credentials) {
            res.writeHeader(`Access-Control-Allow-Credentials`, config.cors.credentials);
        };
    };

    return res.end();
});

for (const method of Object.keys(app.routes.http)) {
    app[`__${method}`] = app[method].bind(app);

    app[method] = function(url, options, ...callbacks) {
        app.routes.http[method][url] = {
            methods: [turnstile, auth, parser, log, ...callbacks]
        };
        
        app[`__${method}`](url, http(method, url, options));
    };
};

app.__publish = app.publish.bind(app);

app.publish = function(topic, action, data) {
    if (typeof data === `object`) {
        data = JSON.stringify(data);
    };

    return app.__publish(topic, `1::${action}${data ? `::${data}` : ``}`);
};

app.message = function(url, action, options, callback) {
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

    if (app.routes.ws[url]) {
        app.routes.ws[url][action] = {
            options: options,
            function: callback
        };
    } else {
        app.routes.ws[url] = {
            [action]: {
                options: options,
                function: callback
            }
        };
    };
};

app.start = function() {
    if (Object.keys(app.routes.ws).length > 0) {
        for (const url of Object.keys(app.routes.ws)) {
            app.ws(url, ws(url));
        };
    };

    app.listen(config.port, function(token) {
        token ? console.log(`[UWSE] [INFO] uWS started on port: ${config.port}.`) : console.log(`[UWSE] [ERROR] uWS not started.`);
    });
};


module.exports = {
    app,
    cache: require(`./dist/cache`),
    discord: require(`./dist/discord`),
    error: require(`./dist/error`),
    google: require(`./dist/google`),
    logger: require(`./dist/logger`),
    mailgun: require(`./dist/mailgun`),
    mysql: require(`./dist/mysql`),
    redis: require(`./dist/redis`),
    session: require(`./dist/session`),
    telegram: require(`./dist/telegram`),
    utils: require(`./dist/utils`),
    validator: require(`./dist/validator`)
};