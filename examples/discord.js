/*
    Получение ссылки для авторизации.
    
    Возвращаемое значение: url. Пример: https://discord.com/oauth2/authorize?client_id=client_id&response_type=code&redirect_uri=redirect_uri&scope=identify+openid&state=STATE.
*/

let authurl = app.social.discord.url(`STATE`);


/*
    Получение данных о пользователе.

    Необходимо указать код, который приходит в вебхук.

    Возвращаемое значение: информация о пользователе в json. Пример: {
        id: 123232387487234,
        global_name: `discord_name`,
        username: `discord_username`,
        avatar: `image_url`,
        banner_color: `#FFFFFF`,
        ...
    }
*/

let user = app.social.discord.user(`oauth_code`);