/*
    Создание платежа.
    
    Аргументы: валюта, сумма (В ЦЕНТАХ).

    Возвращаемое значение: {
        id: `uuid`,
        url: `https://payment.domain/payment_id
    }
*/

const payment = await bitey.payment.cryptomus.payment.create(`USD`, 1000);

/*
    Проверить подлинность запроса.
    Функция сверяет хеш и проверяет статус платежа.

    В аргументе нужно передать всю полезную нагрузку.

    Возвращаемое значение: boolean. true - проверка пройдена, false - нет.
*/

const is_valid = bitey.payment.cryptomus.webhook.verify(req.body.json);