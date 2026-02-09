import { getCache, setCache, deleteCache } from "bitey/cache";


/*
    get example
    return: safe value (structuredClone)
*/

const safeValue = getCache(`myKeyName`);


/*
    set example

    - args: keys ([string, string, ...]), value (any), ttl (in seconds. default: 3600)

    return: original value
*/

const originalValue = setCache([`somethingKey1`, `something:key2:with:any:separators`], { something: `value` }, 600);


/*
    delete example

    - you can delete key
    - you can delete keys by pattern like this `myKey*`, `myFolder:*`
    - you can delete keys in array like this [`key1`, `key2`]

    return: true
*/

deleteCache(`myKeyName`);
deleteCache(`myFolder:*`);
deleteCache([`myFolder:KeyOne`, `myFolder:KeyTwo`]);