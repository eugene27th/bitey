/*
    Создание платежа.
    
    Аргументы: валюта, сумма (В ЦЕНТАХ), заголовок.

    Возвращаемое значение: {
        id: `123`,
        url: `https://payment.domain/payment_id
    }
*/

let payment = bitey.payment.stripe.create(`USD`, 1000, `Top up your balance.`);

/*
    Проверить подлинность запроса.
    Функция сверяет хеш, проверяет статус платежа и разницу во времени.

    Аргументы:
        - signature - хеш из заголовка `stripe_signature`
        - raw - чистая полезная нагрузка, приходящая от stripe (в bitey это buffer и доступен в req.raw)
        - tolerance - (по-умолчанию: 10 минут) допустимая разница между текущей и полученной временной меткой в минутах

    Возвращаемое значение: boolean. true - проверка пройдена, false - нет.
*/

let is_valid = bitey.payment.stripe.verify(`signature`, `raw`, 15);