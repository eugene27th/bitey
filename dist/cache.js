const storage = new Map();


export const setCache = function(keys, value, ttl = 3600) {
    if (!Array.isArray(keys)) {
        keys = [keys];
    };

    const data = {
        value: structuredClone(value),
        expire: (Math.round((new Date().getTime()) / 1000)) + ttl
    };

    for (const key of keys) {
        storage.set(key, data);
    };

    return value;
};

export const getCache = function(key) {
    const entry = storage.get(key);

    if (!entry) {
        return null;
    };

    if ((Math.round((new Date().getTime()) / 1000)) > entry.expire) {
        storage.delete(key);
        return null;
    };

    return structuredClone(entry.value);
};

export const deleteCache = function(keys) {
    if (!Array.isArray(keys)) {
        keys = [keys];
    };

    for (const key of keys) {
        if (key.includes(`*`)) {
            const regex = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, `.*`)}$`);

            for (const storageKey of storage.keys()) {
                if (regex.test(storageKey)) {
                    storage.delete(storageKey);
                };
            };
        } else {
            storage.delete(key);
        };
    };

    return true;
};


setInterval(function() {
    for (const [key, entry] of storage.entries()) {
        if ((Math.round((new Date().getTime()) / 1000)) > entry.expire) {
            storage.delete(key);
        };
    };
}, 600 * 1000);