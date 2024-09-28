const config = require(`${process.cwd()}/config.json`);


const parse = function(cookie) {
    if (!cookie || cookie.length < 1) {
        return null;
    };

    const pairs = cookie.replaceAll(` `, ``).split(`;`);

    if (pairs.length < 1) {
        return null;
    };

    let result = {};

    for (const pair of pairs) {
        const [name, value] = pair.split(`=`);
        result[name] = value;
    };

    return result;
};

const serialize = function(name, value, options = {}) {
    if (config.session?.options) {
        options = {
            ...config.session.options,
            ...options
        };
    };

    return `${name}=${value};${options.age !== undefined ? ` Max-Age=${options.age};` : ``}${options.path ? ` Path=${options.path}`: ``}`;
};


module.exports = {
    parse,
    serialize
};