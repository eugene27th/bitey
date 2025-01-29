const config = require(`${process.cwd()}/config.json`);

if (!config.redis) {
    return module.exports = null;
};


const redis = require(`@redis/client`).createClient({
    url: `redis://:${config.redis.password}@${config.redis.host}:${config.redis.port}`
});

redis.on(`error`, function() {
    console.log(`redis connection error`);
});

redis.connect().then(async function() {
    console.log(`redis connection successful`);
});


module.exports = redis;