const config = require(`${process.cwd()}/config.json`);


if (!config.google) {
    return module.exports = null;
};


const url = function(state, account_id) {
    if (state !== `login`) {
        state += `-${account_id}-${createHmac(`sha256`, config.google.secret).update(`${state}-${account_id}`, `utf8`).digest(`hex`)}`;
    };

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.google.id}&response_type=code&redirect_uri=${encodeURIComponent(config.google.webhook_url)}&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&access_type=offline&state=${state}`;
};

const user = async function(code) {
    let form = new FormData();
    
    form.append(`client_id`, config.google.id);
    form.append(`client_secret`, config.google.secret);
    form.append(`code`, code);
    form.append(`grant_type`, `authorization_code`);
    form.append(`redirect_uri`, config.google.webhook_url);

    let token_response = await fetch(`https://oauth2.googleapis.com/token`, {
        method: `POST`,
        body: form
    });

    if (token_response.status != 200) {
        return false;
    };

    let token = await token_response.json();

    let user_response = await fetch(`https://www.googleapis.com/userinfo/v2/me`, {
        method: `GET`,
        headers: {
            [`Authorization`]: `Bearer ${token.access_token}`
        }
    });

    if (user_response.status != 200) {
        return false;
    };

    return await user_response.json();
};


module.exports = {
    url,
    user
};