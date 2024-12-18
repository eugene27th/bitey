const config = require(`${process.cwd()}/config.json`);

if (!config.discord) {
    return module.exports = null;
};


const url = function(state) {
    return `https://discord.com/oauth2/authorize?client_id=${config.discord.id}&response_type=code&redirect_uri=${encodeURIComponent(config.discord.webhook_url)}&scope=identify+openid${state ? `&state=${state}` : ``}`;
};

const user = async function(code) {
    let form = new FormData();
        form.append(`grant_type`, `authorization_code`);
        form.append(`code`, code);
        form.append(`redirect_uri`, config.discord.webhook_url);

    const token_request = await fetch(`https://discord.com/api/oauth2/token`, {
        method: `POST`,
        headers: {
            [`Authorization`]: `Basic ${Buffer.from(`${config.discord.id}:${config.discord.secret}`).toString(`base64`)}`
        },
        body: form
    });

    if (token_request.status !== 200) {
        return false;
    };

    const token = await token_request.json();

    const user_request = await fetch(`https://discord.com/api/users/@me`, {
        method: `GET`,
        headers: {
            [`Authorization`]: `Bearer ${token.access_token}`
        }
    });

    if (user_request.status !== 200) {
        return false;
    };

    const user = await user_request.json();

    if (user.avatar) {
        user.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`;
    };

    return user;
};


module.exports = {
    url,
    user
};