const config = require(`${process.cwd()}/config.json`);


if (!config.discord) {
    return module.exports = null;
};


const url = function(state, account_id) {
    if (state !== `login`) {
        state += `-${account_id}-${createHmac(`sha256`, config.discord.secret).update(`${state}-${account_id}`, `utf8`).digest(`hex`)}`;
    };

    return `https://discord.com/oauth2/authorize?client_id=${config.discord.id}&response_type=code&redirect_uri=${encodeURIComponent(config.discord.webhook_url)}&scope=identify+openid&state=${state}`;
};

const user = async function(code) {
    let form = new FormData();

    form.append(`grant_type`, `authorization_code`);
    form.append(`code`, code);
    form.append(`redirect_uri`, config.discord.webhook_url);

    let token_response = await fetch(`https://discord.com/api/oauth2/token`, {
        method: `POST`,
        headers: {
            [`Authorization`]: `Basic ${Buffer.from(`${config.discord.id}:${config.discord.secret}`).toString(`base64`)}`
        },
        body: form
    });

    if (token_response.status != 200) {
        return false;
    };

    let token = await token_response.json();

    let user_response = await fetch(`https://discord.com/api/users/@me`, {
        method: `GET`,
        headers: {
            [`Authorization`]: `Bearer ${token.access_token}`
        }
    });

    if (user_response.status != 200) {
        return false;
    };

    let user = await user_response.json();

    if (user.avatar) {
        user.avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`;
    };

    return user;
};


module.exports = {
    url,
    user
};