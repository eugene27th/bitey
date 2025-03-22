const uws = require(`uWebSockets.js`);

const crypto = require(`crypto`);
const validator = require(`./validator`);


const params = function(req) {
    let params = [];

    for (let i = 0; i < req.options.schema.params.length; i++) {
        const param = req.getParameter(i);

        if (!param) {
            return {
                error: `parameter[${i}] is missing`
            };
        };

        if (!validator.value(param, req.options.schema.params[i])) {
            return {
                error: `parameter[${i}] is invalid > ${validator.error()}`
            };
        };

        params.push(param);
    };

    return params;
};

const query = function(req) {
    let query = {};

    const string = req.getQuery();

    if (!string) {
        if (req.options.schema.query.min) {
            return {
                error: `query string is missing`
            };
        };

        if (req.options.schema.query.entries) {
            for (const property of Object.values(req.options.schema.query.entries)) {
                if (property.required) {
                    return {
                        error: `query string is missing`
                    };
                };
            };
        };

        return query;
    };

    const pairs = string.split(`&`);

    if (req.options.schema.query.max && pairs.length > req.options.schema.query.max) {
        return {
            error: `query string is invalid > 'length < ${req.options.schema.query.max}' required`
        };
    };

    if (req.options.schema.query.min && pairs.length < req.options.schema.query.min) {
        return {
            error: `query string is invalid > '${req.options.schema.query.min} < length' required`
        };
    };

    for (const pair of pairs) {
        const [key, value] = pair.split(`=`);
        query[key] = value;
    };

    if (req.options.schema.query.entries && !validator.json(query, req.options.schema.query)) {
        return {
            error: `query string is invalid > ${validator.error()}`
        };
    };

    return query;
};


const json = function(req) {
    if (req.headers[`content-type`].search(`application/json`) < 0) {
        return {
            error: `'application/json' content type required`
        };
    };

    let body;

    try {
        body = JSON.parse(req.raw);
    } catch (err) {
        return {
            error: `body raw is invalid`
        };
    };

    const length = Object.keys(body).length;

    if (req.options.schema.body.max && length > req.options.schema.body.max) {
        return {
            error: `body raw is invalid > 'length < ${req.options.schema.body.max}' required`
        };
    };

    if (req.options.schema.body.min && length < req.options.schema.body.min) {
        return {
            error: `body raw is invalid > '${req.options.schema.body.min} < length' required`
        };
    };

    if (req.options.schema.body.entries && !validator.json(body, req.options.schema.body)) {
        return {
            error: `body raw is invalid > ${validator.error()}`
        };
    };

    return body;
};

const form = function(req) {
    if (req.headers[`content-type`].search(`multipart/form-data`) < 0) {
        return {
            error: `'multipart/form-data' content type required`
        };
    };

    const parts = uws.getParts(req.raw, req.headers[`content-type`]);

    if (!parts) {
        return {
            error: `'multipart/form-data' content type required`
        };
    };

    if (req.options.schema.body.max && parts.length > req.options.schema.body.max) {
        return {
            error: `body raw is invalid > 'length < ${req.options.schema.body.max}' required`
        };
    };

    if (req.options.schema.body.min && parts.length < req.options.schema.body.min) {
        return {
            error: `body raw is invalid > '${req.options.schema.body.min} < length' required`
        };
    };

    for (const [key, property] of Object.entries(req.options.schema.body.entries)) {
        if (property.required && parts.findIndex(function(x) { return key === x.name }) < 0) {
            return {
                error: `body raw is invalid > '${key}' is missing`
            };
        };
    };

    let body = {};

    for (const part of parts) {
        if (!req.options.schema.body.entries[part.name]) {
            return {
                error: `body raw is invalid > '${part.name}' is not required`
            };
        };

        const is_file = typeof part.filename !== `undefined`;

        if (req.options.schema.body.entries[part.name].type === `file`) {
            if (!is_file) {
                return {
                    error: `body raw is invalid > '${part.name}' is invalid > file required`
                };
            };

            if (part.filename.length < 1) {
                return {
                    error: `body raw is invalid > '${part.name}' is invalid > file is invalid`
                };
            };

            if (part.data.byteLength > req.options.schema.body.entries[part.name].size) {
                return {
                    error: `body raw is invalid > '${part.name}' is invalid > 'file size < ${req.options.schema.body.entries[part.name].size} b' required`
                };
            };

            if (req.options.schema.body.entries[part.name].mimetypes && !req.options.schema.body.entries[part.name].mimetypes.includes(part.type)) {
                return {
                    error: `body raw is invalid > '${part.name}' is invalid > '${req.options.schema.body.entries[part.name].mimetypes.join(` / `)}' mimetype required`
                };
            };

            const extensions = {
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
                ext: extensions[part.type] || null,
                size: part.data.byteLength,
                buffer: Buffer.from(part.data)
            };

            if (req.options.schema.body.entries[part.name].hash) {
                file.hash = crypto.createHash(`md5`).update(file.buffer).digest(`hex`);
            };

            if (!body[part.name]) {
                body[part.name] = [file];
            } else {
                if (body[part.name].length >= req.options.schema.body.entries[part.name].max) {
                    return {
                        error: `body raw is invalid > '${part.name}' is invalid > 'length < ${req.options.schema.body.entries[part.name].max}' required`
                    };
                };

                body[part.name].push(file);
            };
        } else {
            if (is_file) {
                return {
                    error: `body raw is invalid > '${part.name}' is invalid > not a file required`
                };
            };

            const value = req.raw.from(part.data).toString();

            if (body[part.name]) {
                return {
                    error: `body raw is invalid > '${part.name}' is invalid > duplicated`
                };
            };

            if (!validator.value(value, req.options.schema.body.entries[part.name])) {
                return {
                    error: `body raw is invalid > ${validator.error()}`
                };
            };

            body[part.name] = value;
        };
    };

    return body;
};

const body = function(req) {
    if (!req.raw) {
        if (req.options.schema.body.min) {
            return {
                error: `body raw is missing`
            };
        };

        for (const property of Object.values(req.options.schema.body.entries)) {
            if (property.required) {
                return {
                    error: `body raw is missing`
                };
            };
        };

        return {};
    };

    if (req.options.schema.body.type === `application/json`) {
        return json(req);
    };

    if (req.options.schema.body.type === `multipart/form-data`) {
        return form(req);
    };

    return {
        error: `unknown content type`
    };
};


module.exports = {
    params,
    query,
    body
};