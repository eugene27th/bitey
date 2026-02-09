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

export const deleteCache = function(keysOrPattern) {
    if (typeof keysOrPattern === `string`) {
        if (keysOrPattern.includes(`*`)) {
            const regex = new RegExp(`^${keysOrPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, `.*`)}$`);

            for (const key of storage.keys()) {
                if (regex.test(key)) {
                    storage.delete(key);
                };
            };
        } else {
            storage.delete(keysOrPattern);
        };
    } else if (Array.isArray(keysOrPattern)) {
        for (const key of keysOrPattern) {
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