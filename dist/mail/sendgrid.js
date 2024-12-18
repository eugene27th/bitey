const config = require(`${process.cwd()}/config.json`);

if (!config.sendgrid) {
    return module.exports = null;
};


const send = async function(data) {
    let personalizations = [];

    for (const recipient of data.to) {
        personalizations.push({
            to: {
                email: recipient
            }
        });
    };

    const request = await fetch(`${config.sendgrid[data.domain].url}/v3/mail/send`, {
        method: `POST`,
        headers: {
            [`Authorization`]: `Bearer ${config.sendgrid[data.domain].key}`,
            [`content-type`]: `application/json`
        },
        body: JSON.stringify({
            personalizations: personalizations,
            from: data.from,
            subject: data.subject,
            content: [
                {
                    type: data.text ? `text/plain` : `text/html`,
                    value: data.text || data.html
                }
            ]
        })
    });

    if (request.status !== 202) {
        return await request.json();
    };

    return {
        errors: null
    };
};


module.exports = {
    send
};