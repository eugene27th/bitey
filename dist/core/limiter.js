const cache = require(`./cache`);


const allowed = function(key, attempts, per) {
    let remaining = cache.get(key);

    if (remaining !== null) {
        if (remaining < 1) {
            return false;
        };

        remaining--;
    };

    return cache.set([key], remaining === null ? attempts - 1 : remaining, per);
};


module.exports = {
    allowed
};