const config = require(`${process.cwd()}/config.json`);


if (!config.database?.redis) {
    return module.exports = null;
};


const redis = require(`@redis/client`).createClient({
    url: `redis://:${config.database.redis.password}@${config.database.redis.host}:${config.database.redis.port}`
});

redis.on(`error`, function() {
    console.log(`[UWSE] [ERROR] Redis connection error.`);
});

redis.connect().then(async function() {
    console.log(`[UWSE] [INFO] Redis connection successful.`);
});


module.exports = {
    redis
};