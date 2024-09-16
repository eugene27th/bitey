const crypto = require(`crypto`);


const timestamp = function(date) {
    if (date) {
        return Math.round((new Date(date).getTime()) / 1000);
    };

    return Math.round((new Date().getTime()) / 1000);
};

const date = function(mode = `d.m.y`) {
    const date = new Date();

    if (mode == `ymd`) {
        return date.toISOString().slice(0, 10);  
    };

    let d = `${date.getUTCDate()}`.padStart(2, `0`);
    let m = `${date.getUTCMonth() + 1}`.padStart(2, `0`);
    let y = date.getUTCFullYear();

    switch (mode) {
        case `d.m.y`:
            return `${d}.${m}.${y}`;

        case `y-m-d`:
            return `${y}-${m}-${d}`;
    
        case `m.y`:
            return `${m}.${y}`;
    };
};

const time = function() {
    const date = new Date();

    return `${`${date.getUTCHours()}`.padStart(2, `0`)}:${`${date.getUTCMinutes()}`.padStart(2, `0`)}:${`${date.getUTCSeconds()}`.padStart(2, `0`)}Z`;
};

const uuidts = function() {
    let uuid = crypto.randomUUID();
    let timestamp = `${timestamp()}`;

    return `${uuid.slice(0,4)}${timestamp.slice(5)}${uuid.slice(4, 30)}${timestamp.slice(0,5)}${uuid.slice(-6)}`;
};

const string = function(options = {}) {
    let chars = {
        all: `QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm0123456789`,
        numbers: `0123456789`,
        letters: `QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm`
    };

    let length = options.length || 30;
    let mode = options.mode || `all`;

    let string = ``;

    for (let i = 0; i < length; i++) {
        string += chars[mode].charAt(Math.floor(Math.random() * chars[mode].length));
    };

    switch (options.case) {
        case `up`:
            return string.toUpperCase();

        case `low`:
            return string.toLowerCase();
    };

    return string;
};

const merge = function(target, ...sources) {
    for (const source of sources) {
        for (const key of Object.keys(source)) {
            if (typeof source[key] === `object` && target[key] !== null) {
                target[key] = merge(target[key], source[key]);
            } else {
                Object.assign(target, {
                    [key]: source[key]
                });
            };
        };
    };
  
    return target;
};

const template = function(template, data) {
    for (const [key, value] of Object.entries(data)) {
        template = template.replaceAll(`{{${key}}}`, value);
    };

    return template;
};


module.exports = {
    timestamp,
    date,
    time,
    uuidts,
    string,
    merge,
    template
};