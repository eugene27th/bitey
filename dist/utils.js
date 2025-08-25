const crypto = require(`crypto`);
const logger = require(`./logger`);


const tryFetch = async function(url, options) {
    for (let a = 1; a <= 5; a++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            logger.log(`fetch > request error > url: ${url} > error: ${error.name} - ${error.message} > options: ${JSON.stringify(options)}${error.cause?.code ? ` > code: ${error.cause.code}` : ``}`);

            if (a >= 5) {
                return {
                    ok: false,
                    error: error
                };
            };
        };
    };
};


const getDate = function(mode = `d.m.y`) {
    const date = new Date();

    if (mode === `ymd`) {
        return date.toISOString().slice(0, 10);
    };

    if (mode === `m.y`) {
        return `${`${date.getUTCMonth() + 1}`.padStart(2, `0`)}.${date.getUTCFullYear()}`;
    };

    return `${`${date.getUTCDate()}`.padStart(2, `0`)}.${`${date.getUTCMonth() + 1}`.padStart(2, `0`)}.${date.getUTCFullYear()}`;
};

const getTime = function() {
    const date = new Date();
    return `${`${date.getUTCHours()}`.padStart(2, `0`)}:${`${date.getUTCMinutes()}`.padStart(2, `0`)}:${`${date.getUTCSeconds()}`.padStart(2, `0`)}Z`;
};

const getTimestamp = function(date) {
    if (date) {
        return Math.round((new Date(date).getTime()) / 1000);
    };

    return Math.round((new Date().getTime()) / 1000);
};


const createUUIDts = function() {
    const uuid = crypto.randomUUID();
    const ts = `${getTimestamp()}`;

    return `${uuid.slice(0, 4)}${ts.slice(5)}${uuid.slice(4, 30)}${ts.slice(0, 5)}${uuid.slice(-6)}`;
};

const createUUID = function() {
    return crypto.randomUUID();
};

const createString = function(length, includes = [`default`]) {
    const charset = {
        "default": `QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm0123456789`,
        "letters": `QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm`,
        "letters-l": `qwertyuiopasdfghjklzxcvbnm`,
        "letters-u": `QWERTYUIOPASDFGHJKLZXCVBNM`,
        "numbers": `0123456789`,
        "symbols": `!?@#$%^&*<>-+=`
    };

    let chars = ``;

    for (const type of includes) {
        chars += charset[type];
    };

    let result = ``;

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    };

    return result;
};


const cookieParse = function(cookie) {
    if (!cookie || cookie.length < 1) {
        return null;
    };

    const pairs = cookie.replaceAll(` `, ``).split(`;`);

    if (pairs.length < 1) {
        return null;
    };

    let result = {};

    for (const pair of pairs) {
        const [name, value] = pair.split(`=`);
        result[name] = value;
    };

    return result;
};

const cookieSerialize = function(name, value, options = {}) {
    let attributes = [];

    if (options.age) {
        attributes.push(`Max-Age=${options.age}`);
    };

    if (options.path) {
        attributes.push(`Path=${options.path}`);
    };

    if (options.domain) {
        attributes.push(`Domain=${options.domain}`);
    };

    if (options.samesite) {
        attributes.push(`SameSite=${options.samesite}`);
    };

    if (options.secure) {
        attributes.push(`Secure`);
    };

    if (attributes.length < 1) {
        return `${name}=${value};`;
    } else {
        return `${name}=${value}; ${attributes.join(`; `)}`;
    };
};


module.exports = {
    fetch: tryFetch,
    get: {
        date: getDate,
        time: getTime,
        timestamp: getTimestamp
    },
    create: {
        uuid: createUUID,
        uuidts: createUUIDts,
        string: createString
    },
    cookie: {
        parse: cookieParse,
        serialize: cookieSerialize
    }
};