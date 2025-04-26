/*
    usage: await bitey.redis.command(args);
*/


/*
    get example
    return value
*/

const get = await bitey.redis.get(`something:key`);


/*
    set example
*/

const set = await bitey.redis.set(`something:key`, JSON.stringify({ something: `data` }), {
    EX: 300 // expire in seconds
});


/*
    scan example
    return array with found keys
*/

const scan = await bitey.redis.scanIterator({
    MATCH: `something:*`
});