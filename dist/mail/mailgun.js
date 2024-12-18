const config = require(`${process.cwd()}/config.json`);

if (!config.mailgun) {
    return module.exports = null;
};


const send = async function(data) {
    if (data.to.length > 1000) {
        return false;
    };

    let form = new FormData();
        form.append(`subject`, data.subject);

    if (data.from.name) {
        form.append(`from`, `${data.from.name} <${data.from.email}>`);
    } else {
        form.append(`from`, data.from.email);
    };

    if (data.to.length > 1) {
        let rv = {};

        for (const recipient of data.to) {
            form.append(`to`, recipient);
            rv[recipient] = {};
        };

        form.append(`recipient-variables`, JSON.stringify(rv));
    } else {
        form.append(`to`, data.to[0]);
    };
    
    data.text ? form.append(`text`, data.text) : form.append(`html`, data.html);

    const request = await fetch(`${config.mailgun[data.domain].url}/messages`, {
        method: `POST`,
        headers: {
            [`Authorization`]: `Basic ${Buffer.from(`api:${config.mailgun[data.domain].key}`).toString(`base64`)}`
        },
        body: form
    });

    if (request.status === 401) {
        return {
            message: `Forbidden`
        };
    };

    const result = await request.json();

    if (request.status !== 200 || !result.id) {
        return result;
    };
    
    return result;
};

const batch = async function(data) {
    if (data.to.length > 1000) {
        return false;
    };

    let form = new FormData();
        form.append(`subject`, data.subject);
        form.append(`recipient-variables`, JSON.stringify(data.to));

    if (data.from.name) {
        form.append(`from`, `${data.from.name} <${data.from.email}>`);
    } else {
        form.append(`from`, data.from.email);
    };

    for (const recipient of Object.keys(data.to)) {
        form.append(`to`, recipient);
    };
    
    data.text ? form.append(`text`, data.text) : form.append(`html`, data.html);

    const request = await fetch(`${config.mailgun[data.domain].url}/messages`, {
        method: `POST`,
        headers: {
            [`Authorization`]: `Basic ${Buffer.from(`api:${config.mailgun[data.domain].key}`).toString(`base64`)}`
        },
        body: form
    });

    if (request.status === 401) {
        return {
            message: `Forbidden`
        };
    };

    const result = await request.json();

    if (request.status !== 200 || !result.id) {
        return result;
    };

    return result;
};


module.exports = {
    send,
    batch
};