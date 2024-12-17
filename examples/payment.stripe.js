/*
    Создание платежа.
    
    Аргументы:
        - валюта
        - сумма (в центах)
        - название
        - интервал (если оформляется подписка)

    Возвращаемое значение: {
        id: `cs_test_a1Vymsrh74twYA9clj6I8fSDX51tEo4hbvR86nwYiGMgN4LvcXAVELeibj`,
        url: `https://checkout.stripe.com/c/pay/cs_test_a135zY2hhPmFV947BoRCAy7Qqv1cGGzuYk1uDOHeeNbBSHvus0EEwQUnY6#fid2cGd2ZndsdXFsamtQa2x0cGBrYHZ2QGtkZ2lgYSc%2FY2RpdmApJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRIYHI2UU1TPENTdDxjc3NpZ3doc01cclJuYHJIPTIyNmk8THB9U0x%2FfXdRVWt9czFDSmdVQk5QV1V8bnJcN3dWQ1VCQlRSXHwwM2kwQUlwRHZ2SXN%2FQzw1NUZnV0ptczBcJyknY3dqaFZgd3Ngdyc%2FcXdwYCknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJyknYGtkZ2lgVWlkZmBtamlhYHd2Jz9xd3BgeCUl`
    }
*/

const payment = await bitey.payment.stripe.checkout.create(`USD`, 1000, `Name`, `month`);

/*
    Проверить подлинность запроса.
    Функция сверяет хеш, проверяет статус платежа и разницу во времени.

    Аргументы:
        - signature - хеш из заголовка `stripe_signature`
        - raw - чистая полезная нагрузка, приходящая от stripe (в bitey это buffer и доступен в req.raw)
        - tolerance - (по-умолчанию: 10 минут) допустимая разница между текущей и полученной временной меткой в минутах

    Возвращаемое значение: boolean. true - проверка пройдена, false - нет.
*/

const is_valid = bitey.payment.stripe.webhook.verify(`signature`, `raw`, 15);