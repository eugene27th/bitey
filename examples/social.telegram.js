/*
    Валидация пользовательских данных.
    Вторым аргументом передаётся допустимая разница между текущей и полученной временной меткой в минутах (по-умолчанию: 2 минуты).

    Возвращаемое значение: boolean. true - проверка пройдена, false - не пройдена.
*/

const is_valid = bitey.social.telegram.valid({
    id: 123343278487234,
    first_name: `Firtsname`,
    username: `username`,
    photo_url: `telegram_photo_url`,
    auth_date: 1234567890,
    hash: `payload_hash`
}, 5);


/*
    Отправка сообщения.
    Необходимо указать id бота (его токен), id чата (например, id аккаунта телеграм) и текст сообщения.
    
    Возвращаемое значение: boolean. true - сообщение отправлено, false - не отправлено.
*/

const status = await bitey.social.telegram.send(`bot_id`, `chat_id`, `Привет!`);