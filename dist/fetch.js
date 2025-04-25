const logger = require(`./logger`);


const send = async function(url, options) {
    let response = {
        ok: false
    };

    for (let a = 1; a <= 5; a++) {
        try {
            response = await fetch(url, options);
            break;
        } catch (error) {
            logger.log(`fetch > request error > url: ${url} > error: ${error.name} - ${error.message} > options: ${JSON.stringify(options)}${error.cause?.code ? ` > code: ${error.cause.code}` : ``}`);

            if (a >= 5) {
                response.error = error;
                return response;
            };
        };
    };

    return response;
};


module.exports = {
    send
};