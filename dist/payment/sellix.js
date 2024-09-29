const config = require(`${process.cwd()}/config.json`);


if (!config.sellix) {
    return module.exports = null;
};


const crypto = require(`crypto`);


const create = async function(currency, amount, title, email) {
    let request = await fetch(`https://dev.sellix.io/v1/payments`, {
        method: `POST`,
        headers: {
            [`content-type`]: `application/json`,
            [`authorization`]: `Bearer ${config.sellix.key}`
        },
        body: JSON.stringify({
            title: title,
            value: amount,
            currency: currency,
            email: email,
            webhook: config.sellix.webhook_url,
            return_url: config.sellix.redirect_url
        })
    });

    if (request.status !== 200) {
        return false;
    };

    let response = await request.json();

    if (response.error || !response.data?.url) {
        return false;
    };

    return response.data;
};

const verify = async function(signature, event, data) {
    if (event !== `order:paid` || !crypto.timingSafeEqual(Buffer.from(crypto.createHmac(`sha512`, config.sellix.webhook_secret).update(JSON.stringify(data)).digest(`hex`)), Buffer.from(signature, `utf-8`))) {
        return false;
    };
    
    return true;
};


module.exports = {
    create,
    verify
};