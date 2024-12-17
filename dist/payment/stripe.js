const config = require(`${process.cwd()}/config.json`);


if (!config.stripe) {
    return module.exports = null;
};


const crypto = require(`crypto`);
const utils = require(`../core/utils`);


const verifyWebhook = function(signature, raw, tolerance = 10) {
    signature = signature.split(`,`);

    const timestamp = signature[0].split(`=`)[1];

    if ((parseInt(timestamp) - utils.timestamp()) < (tolerance * 60)) {
        return false;
    };

    signature = signature[1].split(`=`)[1];

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(crypto.createHmac(`sha256`, config.stripe.webhook_secret).update(`${timestamp}.${raw}`).digest(`hex`)))) {
        return false;
    };

    return true;
};


const getInvoice = async function(stripe_invoice_id) {
    const request = await fetch(`https://api.stripe.com/v1/invoices/${stripe_invoice_id}`, {
        method: `GET`,
        headers: {
            [`Authorization`]: `Basic ${Buffer.from(`${config.stripe.secret_key}:`).toString(`base64`)}`
        }
    });

    if (request.status !== 200) {
        return null;
    };

    return await request.json();
};


const createCheckout = async function(currency, amount, name, interval) {
    let form_price = new URLSearchParams();
        form_price.append(`currency`, currency);
        form_price.append(`unit_amount`, amount);
        form_price.append(`product_data[name]`, name);

    if (interval) {
        form_price.append(`recurring[interval]`, interval);
    };

    const price_request = await fetch(`https://api.stripe.com/v1/prices`, {
        method: `POST`,
        headers: {
            [`content-type`]: `application/x-www-form-urlencoded`,
            [`authorization`]: `Basic ${Buffer.from(`${config.stripe.secret_key}:`).toString(`base64`)}`
        },
        body: form_price.toString()
    });

    if (price_request.status !== 200) {
        return false;
    };

    const price = await price_request.json();

    let form_checkout = new URLSearchParams();
        form_checkout.append(`line_items[0][price]`, price.id);
        form_checkout.append(`line_items[0][quantity]`, 1);
        form_checkout.append(`mode`, interval ? `subscription` : `payment`);
        form_checkout.append(`success_url`, config.stripe.redirect_url);
        form_checkout.append(`cancel_url`, config.stripe.redirect_url);

    const checkout_request = await fetch(`https://api.stripe.com/v1/checkout/sessions`, {
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
    
    return await checkout_request.json();
};

const expireCheckout = async function(stripe_checkout_id) {
    const request = await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripe_checkout_id}/expire`, {
        method: `POST`,
        headers: {
            [`Authorization`]: `Basic ${Buffer.from(`${config.stripe.secret_key}:`).toString(`base64`)}`
        }
    });

    if (request.status !== 200) {
        return false;
    };

    return await request.json();
};


const getSubscription = async function(stripe_subscription_id) {
    const request = await fetch(`https://api.stripe.com/v1/subscriptions/${stripe_subscription_id}`, {
        method: `GET`,
        headers: {
            [`Authorization`]: `Basic ${Buffer.from(`${config.stripe.secret_key}:`).toString(`base64`)}`
        }
    });

    if (request.status !== 200) {
        return null;
    };

    return await request.json();
};

const editSubscription = async function() {
    
};

const resumeSubscription = async function() {

};

const cancelSubscription = async function(stripe_subscription_id) {
    const request = await fetch(`https://api.stripe.com/v1/subscriptions/${stripe_subscription_id}`, {
        method: `DELETE`,
        headers: {
            [`Authorization`]: `Basic ${Buffer.from(`${config.stripe.secret_key}:`).toString(`base64`)}`
        }
    });

    console.log(await request.json())

    if (request.status !== 200) {
        return false;
    };

    return true;
};


module.exports = {
    invoice: {
        get: getInvoice
    },
    checkout: {
        create: createCheckout,
        expire: expireCheckout
    },
    subscription: {
        get: getSubscription,
        edit: editSubscription,
        resume: resumeSubscription,
        cancel: cancelSubscription
    },
    webhook: {
        verify: verifyWebhook
    }
};