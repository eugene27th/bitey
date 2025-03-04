const config = require(`${process.cwd()}/config.json`);

if (!config.session || !config.redis) {
    return module.exports = null;
};

const cache = require(`./cache`);
const redis = require(`./redis`);
const utils = require(`./utils`);
const crypto = require(`crypto`);
const cookie = require(`./cookie`);


const getk = async function(key) {
    const cache_key = `session:${key}`;
    const from_cache = cache.get(cache_key);

    if (from_cache) {
        return from_cache;
    };

    let session = await redis.get(`session:${config.session.name}:${key}`);

    if (!session) {
        return null;
    };

    return cache.set(cache_key, {
        ...JSON.parse(session),
        key: key
    }, 5);
};

const getp = async function(pattern) {
    const cache_key = `sessions:pattern=${pattern}`;
    const from_cache = cache.get(cache_key);

    if (from_cache !== null) {
        return from_cache;
    };

    let sessions = {};

    for await (const key of redis.scanIterator({ MATCH: `session:${config.session.name}:${pattern}` })) {
        sessions[key] = JSON.parse(await redis.get(key));
    };

    return cache.set(cache_key, sessions, 60);
};

const getc = async function(cookies) {
    cookies = cookie.parse(cookies);

    if (!cookies || !cookies[config.session.name]) {
        return null;
    };

    const key = cookies[config.session.name].slice(0, cookies[config.session.name].lastIndexOf(`.`));

    const incoming_buffer = Buffer.from(cookies[config.session.name]);
    const expected_buffer = Buffer.from(`${key}.${crypto.createHmac(`sha256`, config.session.secret).update(key).digest(`base64`).replace(/\=+$/, ``)}`);

    if (expected_buffer.length !== incoming_buffer.length || !crypto.timingSafeEqual(expected_buffer, incoming_buffer)) {
        return null;
    };

    return await getk(key);
};

const create = async function(data) {
    const key = `${data.id}:${utils.string(6)}.${utils.string(4)}.${utils.string(8)}.${utils.string(16)}`;
    const cookie = `${key}.${crypto.createHmac(`sha256`, config.session.secret).update(key).digest(`base64`).replace(/\=+$/, ``)}`;

    await redis.set(`session:${config.session.name}:${key}`, JSON.stringify(data), {
        EX: config.session.cookie.age
    });

    return cache.set(`session:${key}`, {
        ...data,
        key: key,
        cookie: cookie
    }, 5);
};

const edit = async function(key, data) {
    let session = await redis.get(`session:${config.session.name}:${key}`);

    if (!session) {
        return false;
    };

    await redis.set(`session:${config.session.name}:${key}`, JSON.stringify({
        ...JSON.parse(session),
        ...data
    }), {
        EX: config.session.cookie.age
    });

    return cache.del([`session:${key}`, `sessions:`]);
};

const close = async function(key) {
    await redis.del(`session:${config.session.name}:${key}`);
    return cache.del([`session:${key}`, `sessions:`]);
};


module.exports = {
    get: {
        key: getk,
        cookies: getc,
        pattern: getp
    },
    create,
    edit,
    close
};