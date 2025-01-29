const config = require(`${process.cwd()}/config.json`);

const cache = require(`./cache`);


const limit = function(key, rate) {
    let remaining = cache.get(key);

    if (remaining !== null) {
        if (remaining < 1) {
            return false;
        };

        remaining--;
    };

    cache.set([key], remaining === null ? rate[0] - 1 : remaining, rate[1]);

    return true;
};

const http = function(req) {
    if (config.guard?.http?.[`*`] && !limit(`http_global:ip=${req.headers[`cf-connecting-ip`] || `unknown`}`, config.guard.http[`*`])) {
        return {
            error: `${config.guard.http[`*`][0]} attempts per ${config.guard.http[`*`][1]} seconds`
        };
    };

    if (config.guard?.http?.[req.method] && !limit(`http_method:method=${req.method}-ip=${req.headers[`cf-connecting-ip`] || `unknown`}`, config.guard.http[req.method])) {
        return {
            error: `${config.guard.http[req.method][0]} attempts per ${config.guard.http[req.method][1]} seconds on this method`
        };
    };

    if (req.options.guard && !limit(`http_route:url=${req.url}-ip=${req.headers[`cf-connecting-ip`] || `unknown`}`, req.options.guard)) {
        return {
            error: `${req.options.guard[0]} attempts per ${req.options.guard[1]} seconds on this route`
        };
    };
    
    return true;
};


module.exports = {
    http
};