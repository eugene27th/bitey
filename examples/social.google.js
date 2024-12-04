/*
    Получение ссылки для авторизации.
    Поле 'state' (аргумент функции) вернётся на вебхук после редиректа. В нём нужно указать то, с помощью чего можно будет валидировать запрос (например, какой-нибудь hmac или значение и его hmac).
    
    Возвращаемое значение функции: url для авторизации. Пример: https://accounts.google.com/o/oauth2/v2/auth?client_id=client_id&response_type=code&redirect_uri=redirect_uri&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&access_type=offline&state=STATE.

    Параметры, которые вернутся на вебхук: state, code, scope, authuser, prompt, error, error_description.
*/

const authurl = bitey.social.google.url(`STATE`);


/*
    Получение данных о пользователе.
    Необходимо указать код, который приходит на вебхук в параметре 'code'.

    Возвращаемое значение: информация о пользователе в json или false в случае неудачи.
    
    Пример: {
        id: 123232387487234,
        name: `google_name`,
        email: `google@gmail.com`,
        verified_email: true,
        picture: `image_url`,
        ...
    }
*/

const user = await bitey.social.google.user(`code`);