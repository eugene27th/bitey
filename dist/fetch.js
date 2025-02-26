const logger = require(`./logger`);


const send = async function(options = {}) {
    let init = {};

    if (options.method) {
        init.method = options.method;
    };

    if (options.headers) {
        init.headers = options.headers;
    };

    if (options.body) {
        init.body = options.body;
    };

    let response;

    for (let a = 1; a <= (options.attempts || 5); a++) {
        try {
            response = await fetch(options.url, Object.keys(init).length > 0 ? init : null);
            break;
        } catch (error) {
            logger.log(`fetch:error > ${options.url} > error: ${error.name} - ${error.message} > options: ${JSON.stringify(options)}${error.cause?.code ? ` > code: ${error.cause.code}` : ``}`);

            if (a >= (options.attempts || 5)) {
                return false;
            };
        };
    };

    if (!response.ok) {
        logger.log(`fetch:error > ${options.url} > status: ${response.status} > options: ${JSON.stringify(options)}`);
    };

    if (options.parse) {
        try {
            if (options.parse === `json`) {
                return await response.json();
            };

            if (options.parse === `text`) {
                return await response.text();
            };

            if (options.parse === `buffer`) {
                return await response.arrayBuffer();
            };
        } catch (error) {
            logger.log(`fetch:error > ${options.url} > error: ${error.name} - ${error.message} > options: ${JSON.stringify(options)}`);
            return false;
        }; 
    };

    return true;
};


module.exports = {
    send
};