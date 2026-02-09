/*
    required `redis` section in config.json
*/

import { redisClient } from "bitey/redis";


/* get example */
const get = await redisClient.get(`something:key`);


/* set example */
const set = await redisClient.set(`something:key`, JSON.stringify({ something: `data` }), {
    EX: 300 // expire in seconds
});


/* scan example */
const scan = redisClient.scanIterator({
    MATCH: `something:*`
});