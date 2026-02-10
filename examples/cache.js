import { getCache, setCache, deleteCache } from "bitey/cache";


/*
    get example
    return: safe value (structuredClone)
*/

const safeValue = getCache(`myKeyName`);


/*
    set example

    - args: keys (array), value (any), ttl (in seconds. default: 3600)

    return: original value
*/

const originalValue = setCache([`myKey`, `folder:mykey:with:any:separators`], { something: `value` }, 600);


/*
    delete example

    - args: keys (array or string)
    - you can delete keys by pattern with '*' like this: `myKeys*`, `myFolder:*`, etc.

    return: true
*/

deleteCache([`myKeyName`, `myFolder:*`, `mySecondFolder:KeyOne`, `mySecondFolder:KeyTwo`]);

/* used less frequently */
deleteCache(`myKeyName`);
deleteCache(`myFolder:*`);