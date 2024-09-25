const uwse = require(`uwse`);


/*
    Валидация пользовательских данных.
    
    Возвращаемое значение: boolean. true - проверка пройдена, false - не пройдена.
*/

let is_valid = uwse.social.telegram.valid({
    id: 123343278487234,
    first_name: `Firtsname`,
    username: `username`,
    photo_url: `telegram_photo_url`,
    auth_date: 1234567890,
    hash: `payload_hash`
});


/*
    Отправка сообщения.

    Необходимо указать id бота (его токен), id чата (например, id аккаунта телеграм) и текст сообщения.

    Возвращаемое значение: boolean. true - сообщение отправлено, false - не отправлено.
*/

let status = uwse.social.telegram.send(`bot_id`, `chat_id`, `Привет!`);