const config = require(`${process.cwd()}/config.json`);

if (!config.coinbase) {
    return module.exports = null;
};

const crypto = require(`crypto`);


const verifyWebhook = async function(signature, data) {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(crypto.createHmac(`sha256`, config.coinbase.webhook_secret).update(JSON.stringify(data), `utf8`).digest(`hex`)))) {
        return false;
    };

    return true;
};

const createCharge = async function(currency, amount, name, description) {
    const request = await fetch(`https://api.commerce.coinbase.com/charges`, {
        method: `POST`,
        headers: {
            [`content-type`]: `application/json`,
            [`x-cc-api-key`]: config.coinbase.key,
            [`x-cc-version`]: `2018-03-22`
        },
        body: JSON.stringify({
            name: name,
            description: description,
            pricing_type: `fixed_price`,
            local_price: {
                amount: (amount / 100).toFixed(2),
                currency: currency
            },
            redirect_url: config.coinbase.redirect_url,
            cancel_url: config.coinbase.redirect_url
        })
    });

    if (request.status !== 201) {
        return false;
    };

    const response = await request.json();

    if (!response.data?.hosted_url) {
        return false;
    };

    return response.data;
};


module.exports = {
    charge: {
        create: createCharge
    },
    webhook: {
        verify: verifyWebhook
    }
};