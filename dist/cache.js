let storage = {};
const dttl = 7200;


const parse = function(key) {
    let folder = `default`;
    const path = key.split(`:`);

    if (path.length < 2 || path[0].length < 1) {
        return {
            folder: folder,
            key: path
        };
    };

    folder = path[0];
    key = path.splice(1).join();

    if (key.length < 1) {
        return {
            folder: folder
        };
    };

    return {
        folder: folder,
        key: key
    };
};

const set = function(keys, value, ttl = dttl) {
    if (!Array.isArray(keys)) {
        keys = [keys];
    };

    let data = {
        value: value,
        expire: (Math.round((new Date().getTime()) / 1000)) + ttl
    };

    if (typeof value === `object` && !Array.isArray(value) && value !== null) {
        data.value = structuredClone(value);
    };

    for (let i = 0; i < keys.length; i++) {
        const { key, folder } = parse(keys[i]);

        if (storage[folder]) {
            storage[folder][key] = data;
        } else {
            storage[folder] = {
                [key]: data
            };
        };
    };

    return value;
};

const get = function(key) {
    const path = parse(key);

    if (!(path.folder in storage)) {
        return null;
    };

    if (!path.key) {
        return storage[path.folder];
    };
    
    if (!(path.key in storage[path.folder])) {
        return null;
    };

    const data = storage[path.folder][path.key];

    if ((Math.round((new Date().getTime()) / 1000)) > data.expire) {
        delete storage[path.folder][path.key];
        return null;
    };

    return structuredClone(data.value);
};

const del = function(keys, deleq = false) {
    if (!Array.isArray(keys)) {
        keys = [keys];
    };

    for (const key of keys) {
        const path = parse(key);

        if (!storage[path.folder]) {
            continue;
        };

        if (!path.key) {
            delete storage[path.folder];
            continue;
        };

        if (deleq) {
            const value = storage[path.folder][path.key];

            for (const [folder, keys] of Object.entries(storage)) {
                for (const [key, data] of Object.entries(keys)) {
                    if (JSON.stringify(value) === JSON.stringify(data)) {
                        delete storage[folder][key];
                    };
                };
            };
        } else {
            delete storage[path.folder][path.key];
        };

        if (Object.keys(storage[path.folder]).length < 1) {
            delete storage[path.folder];
        };
    };

    return true;
};


setInterval(function() {
    for (const [folder, keys] of Object.entries(storage)) {
        for (const [key, data] of Object.entries(keys)) {
            if ((Math.round((new Date().getTime()) / 1000)) > data.expire) {
                delete storage[folder][key];

                if (Object.keys(keys).length < 1) {
                    delete storage[folder];
                };
            };
        }
    };
}, 1800 * 1000);


module.exports = {
    get,
    set,
    del
};