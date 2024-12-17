const config = require(`${process.cwd()}/config.json`);
const logger = require(`./logger`);


const turnstile = async function(req) {
    if (!req.headers.challenge) {
        return {
            error: `ER_INV_DATA`,
            message: `turnstile is invalid > header 'challenge' is missing`
        };
    };

    let form = new FormData();
        form.append(`secret`, config.cloudflare.turnstile.secret_key);
        form.append(`response`, req.headers.challenge);
        form.append(`remoteip`, req.headers.ip);

    const request = await fetch(`https://challenges.cloudflare.com/turnstile/v0/siteverify`, {
        method: `POST`,
        body: form
    });

    if (request.status != 200) {
        logger.log(`[CLOUDFLARE TURNSTILE] [FAILED] [${req.method}] [${req.url}] [${req.headers.ip}] [${request.status}]`);

        return {
            error: `ER_CHALLENGE_FAILED`,
            message: `turnstile is invalid > challenge is failed`
        };
    };

    const response = await request.json();

    if (!response.success) {
        logger.log(`[CLOUDFLARE TURNSTILE] [FAILED] [${req.method}] [${req.url}] [${req.headers.ip}] [${request[`error-codes`]}]`);

        return {
            error: `ER_CHALLENGE_FAILED`,
            message: `turnstile is invalid > challenge is failed`
        };
    };

    return true;
};


module.exports = {
    turnstile
};