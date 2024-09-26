const config = require(`${process.cwd()}/config.json`);


if (!config.stripe) {
    return module.exports = null;
};


const crypto = require(`crypto`);


const create = async function(currency, amount, title) {
    let form_price = new URLSearchParams();
        form_price.append(`currency`, currency);
        form_price.append(`unit_amount`, amount);
        form_price.append(`product_data[name]`, title);

    let price_request = await fetch(`https://api.stripe.com/v1/prices`, {
        method: `POST`,
        headers: {
            [`Content-Type`]: `application/x-www-form-urlencoded`,
            [`Authorization`]: `Basic ${Buffer.from(`${config.stripe.secret_key}:`).toString(`base64`)}`
        },
        body: form_price.toString()
    });

    if (price_request.status !== 200) {
        return false;
    };

    let price_response = await price_request.json();

    let form_checkout = new URLSearchParams();
        form_checkout.append(`line_items[0][price]`, price_response.id);
        form_checkout.append(`line_items[0][quantity]`, 1);
        form_checkout.append(`mode`, `payment`);
        form_checkout.append(`success_url`, config.stripe.redirect_url);
        form_checkout.append(`cancel_url`, config.stripe.redirect_url);

    let checkout_request = await fetch(`https://api.stripe.com/v1/checkout/sessions`, {
        method: `POST`,
        headers: {
            [`Content-Type`]: `application/x-www-form-urlencoded`,
            [`Authorization`]: `Basic ${Buffer.from(`${config.stripe.secret_key}:`).toString(`base64`)}`
        },
        body: form_checkout.toString()
    });

    if (checkout_request.status !== 200) {
        return false;
    };

    let checkout_response = await checkout_request.json();

    if (!checkout_response.url) {
        return false;
    };
    
    return checkout_response;
};

const verify = async function(signature, raw) {
    let data = JSON.parse(Buffer.from(raw));

    if (data.type !== `checkout.session.completed`) {
        return false;
    };

    signature = signature.split(`,`);

    let timestamp = signature[0].split(`=`)[1];

    signature = signature[1].split(`=`)[1];

    if (signature !== crypto.createHmac(`sha256`, config.stripe.webhook_secret).update(`${timestamp}.${raw}`).digest(`hex`)) {
        return false;
    };

    return true;
};


module.exports = {
    create,
    verify
};