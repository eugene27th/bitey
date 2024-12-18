const config = require(`${process.cwd()}/config.json`);

if (!config.google) {
    return module.exports = null;
};


const url = function(state) {
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.google.id}&response_type=code&redirect_uri=${encodeURIComponent(config.google.webhook_url)}&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&access_type=offline${state ? `&state=${state}` : ``}`;
};

const user = async function(code) {
    let form = new FormData();
        form.append(`client_id`, config.google.id);
        form.append(`client_secret`, config.google.secret);
        form.append(`code`, code);
        form.append(`grant_type`, `authorization_code`);
        form.append(`redirect_uri`, config.google.webhook_url);

    const token_request = await fetch(`https://oauth2.googleapis.com/token`, {
        method: `POST`,
        body: form
    });

    if (token_request.status !== 200) {
        return false;
    };

    const token = await token_request.json();

    const user_request = await fetch(`https://www.googleapis.com/userinfo/v2/me`, {
        method: `GET`,
        headers: {
            [`Authorization`]: `Bearer ${token.access_token}`
        }
    });

    if (user_request.status !== 200) {
        return false;
    };

    return await user_request.json();
};


module.exports = {
    url,
    user
};