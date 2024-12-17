const config = require(`${process.cwd()}/config.json`);


if (!config.telegram) {
    return module.exports = null;
};


const crypto = require(`crypto`);
const utils = require(`../core/utils`);


const valid = function(payload, tolerance = 2) {
    const { hash, ...data } = payload;

    const secret = crypto.createHash(`sha256`).update(config.telegram.token).digest();
    const string = Object.keys(data).sort().filter(key => data[key]).map(key => (`${key}=${data[key]}`)).join(`\n`);

    const sign = crypto.createHmac(`sha256`, secret).update(string).digest(`hex`);

    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(sign)) || (utils.timestamp() - data.auth_date) > (tolerance * 60)) {
        return false;
    };

    return true;
};

const send = async function(bot_id, chat_id, text) {
    const request = await fetch(`https://api.telegram.org/bot${bot_id}/sendMessage`, {
        method: `POST`,
        headers: {
            [`Content-Type`]: `application/json`
        },
        body: JSON.stringify({
            chat_id: chat_id,
            text: text,
            parse_mode: `HTML`
        })
    });

    if (request.status != 200) {
        return false;
    };

    const response = await request.json();

    if (!response.ok) {
        return false;
    };

    return true;
};


module.exports = {
    valid,
    send
};