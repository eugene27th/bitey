const config = require(`${process.cwd()}/config.json`);

if (!config.cryptomus) {
    return module.exports = null;
};

const crypto = require(`crypto`);


const verifyWebhook = function(payload) {
    const { sign, ...data } = payload;

    if (!crypto.timingSafeEqual(Buffer.from(sign), Buffer.from(crypto.createHash(`md5`).update(Buffer.from(JSON.stringify(data)).toString(`base64`) + config.cryptomus.key).digest(`hex`)))) {
        return false;
    };

    return true;
};

const createPayment = async function(currency, amount) {
    const body = JSON.stringify({
        order_id: crypto.randomUUID(),
        currency: currency,
        amount: (amount / 100).toFixed(2),
        url_return: config.cryptomus.redirect_url,
        url_callback: config.cryptomus.webhook_url
    });
    
    const request = await fetch(`https://api.cryptomus.com/v1/payment`, {
        method: `POST`,
        headers: {
            [`content-type`]: `application/json`,
            [`merchant`]: config.cryptomus.merchant,
            [`sign`]: crypto.createHash(`md5`).update(Buffer.from(body).toString(`base64`) + config.cryptomus.key).digest(`hex`)
        },
        body: body
    });
    
    if (request.status !== 200) {
        return false;
    };
    
    const response = await request.json();
    
    if (!response.result?.url) {
        return false;
    };
    
    return {
        id: response.result.uuid,
        url: response.result.url
    };
};


module.exports = {
    payment: {
        create: createPayment
    },
    webhook: {
        verify: verifyWebhook
    }
};