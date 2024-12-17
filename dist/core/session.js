const config = require(`${process.cwd()}/config.json`);


if (!config.session || !config.database?.redis) {
    return module.exports = null;
};


const crypto = require(`crypto`);

const cache = require(`./cache`);
const redis = require(`./redis`);
const utils = require(`./utils`);
const cookie = require(`./cookie`);


const get = async function(res, req) {
    const cookies = cookie.parse(req.headers.cookie || req.headers.session || req.headers.wsprotocol);

    if (!cookies || !cookies[config.session.name]) {
        return null;
    };

    const cookie_value = cookies[config.session.name].slice(0, cookies[config.session.name].lastIndexOf(`.`));

    const incoming_buffer = Buffer.from(cookies[config.session.name]);
    const expected_buffer = Buffer.from(`${cookie_value}.${crypto.createHmac(`sha256`, config.session.secret).update(cookie_value).digest(`base64`).replace(/\=+$/, ``)}`);
    
    if (expected_buffer.length !== incoming_buffer.length || !crypto.timingSafeEqual(expected_buffer, incoming_buffer)) {
        return null;
    };

    const session_short_lived = cache.get(`session-short-lived:${cookie_value}`);

    if (session_short_lived) {
        return session_short_lived;
    };

    let session = await redis.get(`session:${config.session.name}:${cookie_value}`);

    if (!session) {
        return null;
    };

    session = JSON.parse(session);

    if (config.session.termination_new_ip && session.ip !== req.headers.ip) {
        await close(res, req);
        return null;
    };

    return cache.set(`session-short-lived:${cookie_value}`, {
        ...session,
        key: cookie_value
    }, 5);
};

const create = async function(res, req, data) {
    const cookie_value = `${utils.string(6)}.${utils.string(4)}.${utils.string(8)}.${utils.string(16)}`;
    const cookie_encrypted = `${cookie_value}.${crypto.createHmac(`sha256`, config.session.secret).update(cookie_value).digest(`base64`).replace(/\=+$/, ``)}`;

    res.setHeader(`Set-Cookie`, cookie.serialize(config.session.name, cookie_encrypted));

    const session = {
        ip: req.headers.ip,
        ...data
    };

    await redis.set(`session:${config.session.name}:${cookie_value}`, JSON.stringify(session), {
        EX: config.session.options.maxAge
    });
    
    return cache.set(`session-short-lived:${cookie_value}`, {
        ...session,
        key: cookie_value
    }, 5);
};

const edit = async function(req, data) {
    let session = await redis.get(`session:${config.session.name}:${req.session.cookie_value}`);

    if (!session) {
        return false;
    };

    session = utils.merge(JSON.parse(session), data);

    await redis.set(`session:${config.session.name}:${req.session.cookie_value}`, JSON.stringify(session), {
        EX: config.session.options.maxAge
    });
    
    cache.del([`session-short-lived:${req.session.cookie_value}`]);

    return session;
};

const close = async function(res, req) {
    if (req.session) {
        res.setHeader(`Set-Cookie`, cookie.serialize(config.session.name, ``, {
            age: 0
        }));

        await redis.del(`session:${config.session.name}:${req.session.cookie_value}`);
    };

    return true;
};


module.exports = {
    get,
    create,
    edit,
    close,
    account: {}
};