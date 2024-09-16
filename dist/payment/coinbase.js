const config = require(`${process.cwd()}/config.json`);


if (!config.coinbase) {
    return module.exports = null;
};


const crypto = require(`crypto`);


const create = async function(currency, amount, name, description) {
    let request = await fetch(`https://api.commerce.coinbase.com/charges`, {
        method: `POST`,
        headers: {
            "Content-Type": `application/json`,
            "X-CC-Api-Key": config.coinbase.key,
            "X-CC-Version": `2018-03-22`
        },
        body: JSON.stringify({
            name: name,
            description: description,
            pricing_type: `fixed_price`,
            local_price: {
                amount: amount,
                currency: currency
            },
            redirect_url: config.coinbase.redirect_url,
            cancel_url: config.coinbase.redirect_url
        })
    });

    if (request.status !== 201) {
        return false;
    };

    let response = await request.json();

    if (!response.data?.hosted_url) {
        return false;
    };

    return response.data;
};

const verify = async function(signature, data) {
    if (data.event?.type !== `charge:confirmed` || signature != crypto.createHmac(`sha256`, config.coinbase.webhook_secret).update(JSON.stringify(data), `utf8`).digest(`hex`)) {
        return false;
    };

    return true;
};


module.exports = {
    create,
    verify
};