import { getConfig } from "./utils.js";

const config = getConfig();

import { createClient } from "@redis/client";


export const redisClient = createClient({
    url: `redis://:${config.redis.password}@${config.redis.host}:${config.redis.port}`
});

redisClient.on(`error`, function() {
    console.log(`redis connection error`);
});

redisClient.connect().then(async function() {
    console.log(`redis connection successful`);
});