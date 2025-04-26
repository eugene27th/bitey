const logger = require(`./logger`);


const send = async function(url, options) {
    for (let a = 1; a <= 5; a++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            logger.log(`fetch > request error > url: ${url} > error: ${error.name} - ${error.message} > options: ${JSON.stringify(options)}${error.cause?.code ? ` > code: ${error.cause.code}` : ``}`);

            if (a >= 5) {
                return {
                    ok: false,
                    error: error
                };
            };
        };
    };
};


module.exports = {
    send
};