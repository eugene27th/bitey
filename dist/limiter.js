const cache = require(`./cache`);


const allowed = function(key, attempts, per) {
    let remaining = cache.get(key);

    if (remaining !== null) {
        if (remaining < 1) {
            return false;
        };

        remaining--;
    };

    cache.set([key], remaining === null ? attempts - 1 : remaining, per);

    return true;
};


module.exports = {
    allowed
};