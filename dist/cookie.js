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

    let attributes = [];

    if (options.age) {
        attributes.push(`Max-Age=${options.age}`);
    };

    if (options.path) {
        attributes.push(`Path=${options.path}`);
    };

    if (options.domain) {
        attributes.push(`Domain=${options.domain}`);
    };

    if (options.samesite) {
        attributes.push(`SameSite=${options.samesite}`);
    };

    if (options.secure) {
        attributes.push(`Secure`);
    };

    if (attributes.length < 1) {
        return `${name}=${value};`;
    } else {
        return `${name}=${value}; ${attributes.join(`; `)}`;
    };
};


module.exports = {
    parse,
    serialize
};