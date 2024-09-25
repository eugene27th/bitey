const config = require(`${process.cwd()}/config.json`);


if (!config.telegram) {
    return module.exports = null;
};


const utils = require(`../core/utils`);


const valid = function(payload) {
    let { hash, ...data } = payload;

    let secret = createHash(`sha256`).update(config.telegram.token).digest();
    let string = Object.keys(data).sort().filter(key => data[key]).map(key => (`${key}=${data[key]}`)).join(`\n`);

    let sign = createHmac(`sha256`, secret).update(string).digest(`hex`);

    if (hash !== sign || (utils.timestamp() - data.auth_date) > (3 * 60)) {
        return false;
    };

    return true;
};

const send = async function(bot_id, chat_id, text) {
    let response = await fetch(`https://api.telegram.org/bot${bot_id}/sendMessage`, {
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

    if (response.status != 200) {
        return false;
    };

    let result = await response.json();

    if (!result.ok) {
        return false;
    };

    return true;
};


module.exports = {
    valid,
    send
};