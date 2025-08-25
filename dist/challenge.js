const config = require(`${process.cwd()}/config.json`);

if (!config.cloudflare) {
    return module.exports = null;
};

const logger = require(`./logger`);


const turnstile = async function(req) {
    if (!req.headers[`cf-challenge`]) {
        return {
            error: `ER_INV_DATA`,
            message: `cloudflare turnstile failed > header 'challenge' is missing`
        };
    };

    let form = new FormData();
        form.append(`secret`, config.cloudflare.turnstile.secret_key);
        form.append(`response`, req.headers[`cf-challenge`]);
        form.append(`remoteip`, req.user.ip);

    const request = await fetch(`https://challenges.cloudflare.com/turnstile/v0/siteverify`, { method: `POST`, body: form });

    if (request.status !== 200 || !(await request.json()).success) {
        logger.log(`http:${req.method} > ${req.user.ip || `unknown ip`} > ${req.url} > turnstile failed`);

        return {
            error: `ER_CHALLENGE_FAILED`,
            message: `cloudflare turnstile failed`
        };
    };

    return true;
};


module.exports = {
    turnstile
};