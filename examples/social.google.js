const uwse = require(`uwse`);


/*
    Получение ссылки для авторизации.
    
    Возвращаемое значение: url. Пример: https://accounts.google.com/o/oauth2/v2/auth?client_id=client_id&response_type=code&redirect_uri=redirect_uri&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&access_type=offline&state=STATE.
*/

let authurl = uwse.social.google.url(`STATE`);


/*
    Получение данных о пользователе.

    Необходимо указать код, который приходит в вебхук.

    Возвращаемое значение: информация о пользователе в json. Пример: {
        id: 123232387487234,
        name: `google_name`,
        email: `google@gmail.com`,
        verified_email: true,
        picture: `image_url`,
        ...
    }
*/

let user = uwse.social.google.user(`oauth_code`);