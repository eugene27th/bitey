const crypto = require(`crypto`);


const date = function(mode = `d.m.y`) {
    const date = new Date();

    if (mode === `ymd`) {
        return date.toISOString().slice(0, 10);
    };

    if (mode === `m.y`) {
        return `${`${date.getUTCMonth() + 1}`.padStart(2, `0`)}.${date.getUTCFullYear()}`;
    };

    return `${`${date.getUTCDate()}`.padStart(2, `0`)}.${`${date.getUTCMonth() + 1}`.padStart(2, `0`)}.${date.getUTCFullYear()}`;
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
    let chars = `QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm0123456789`;

    if (tocase === `up`) {
        chars = `QWERTYUIOPASDFGHJKLZXCVBNM0123456789`;
    } else if (tocase === `low`) {
        chars = `qwertyuiopasdfghjklzxcvbnm0123456789`;
    };

    let result = ``;

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
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