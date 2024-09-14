const config = require(`${process.cwd()}/config.json`);


if (!config.mailgun) {
    return module.exports = null;
};


const send = async function(data) {
    let form = new FormData();

    form.append(`from`, data.from);
    form.append(`subject`, data.subject);

    for (const recipient of data.to) {
        form.append(`to`, recipient);
    };
    
    data.text ? form.append(`text`, data.text) : form.append(`html`, data.html);

    let response = await fetch(`${config.mailgun[data.domain].url}/messages`, {
        method: `POST`,
        headers: {
            [`Authorization`]: `Basic ${Buffer.from(`api:${config.mailgun[data.domain].key}`).toString(`base64`)}`
        },
        body: form
    });

    if (response.status != 200) {
        return false;
    };

    let result = await response.json();

    if (!result.id) {
        return false;
    };

    return result.id;
};


module.exports = {
    send
};