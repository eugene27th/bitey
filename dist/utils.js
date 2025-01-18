const crypto = require(`crypto`);


const date = function(mode = `d.m.y`) {
    const date = new Date();

    if (mode == `ymd`) {
        return date.toISOString().slice(0, 10);
    };

    const d = `${date.getUTCDate()}`.padStart(2, `0`);
    const m = `${date.getUTCMonth() + 1}`.padStart(2, `0`);
    const y = date.getUTCFullYear();

    switch (mode) {
        case `d.m.y`: return `${d}.${m}.${y}`;
        case `y-m-d`: return `${y}-${m}-${d}`;
        case `m.y`: return `${m}.${y}`;
    };
};

const time = function() {
    const date = new Date();
    return `${`${date.getUTCHours()}`.padStart(2, `0`)}:${`${date.getUTCMinutes()}`.padStart(2, `0`)}:${`${date.getUTCSeconds()}`.padStart(2, `0`)}Z`;
};

const timestamp = function(date) {
    if (date) {
        return Math.round((new Date(date).getTime()) / 1000);
    };

    return Math.round((new Date().getTime()) / 1000);
};

const uuidts = function() {
    const uuid = crypto.randomUUID();
    const ts = `${timestamp()}`;

    return `${uuid.slice(0, 4)}${ts.slice(5)}${uuid.slice(4, 30)}${ts.slice(0, 5)}${uuid.slice(-6)}`;
};

const string = function(length, tocase) {
    const chars = `QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm0123456789`;

    let result = ``;

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    };

    if (tocase) {
        if (tocase === `up`) {
            return result.toUpperCase();
        };

        if (tocase === `low`) {
            return result.toLowerCase();
        };
    };

    return result;
};


module.exports = {
    date,
    time,
    timestamp,
    uuidts,
    string
};