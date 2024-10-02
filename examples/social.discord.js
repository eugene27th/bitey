/*
    Получение ссылки для авторизации.
    Поле 'state' (аргумент функции) вернётся на вебхук после редиректа. В нём нужно указать то, с помощью чего можно будет валидировать запрос (например, какой-нибудь hmac или значение и его hmac).
    
    Возвращаемое значение функции: url для авторизации. Пример: https://discord.com/oauth2/authorize?client_id=client_id&response_type=code&redirect_uri=redirect_uri&scope=identify+openid&state=STATE.

    Параметры, которые вернутся на вебхук: state, code, error, error_description.
*/

let authurl = bitey.social.discord.url(`STATE`);


/*
    Получение данных о пользователе.
    Необходимо указать код, который приходит на вебхук в параметре 'code'.

    Возвращаемое значение: информация о пользователе в json. Пример: {
        id: 123232387487234,
        global_name: `discord_name`,
        username: `discord_username`,
        avatar: `image_url`,
        banner_color: `#FFFFFF`,
        ...
    }
*/

let user = bitey.social.discord.user(`code`);