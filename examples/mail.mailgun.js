/*
    Отправка HTML письма (text/html).

    Возвращаемое значение:
        200: {
            id: `message-id`,
            message: `Queued. Thank you.`
        }
        !200: {
            message: `Error description`
        }
*/

const response_html = await bitey.mail.mailgun.send({
    domain: `name.domain`,
    from: {
        email: `no-reply@name.domain`,
        name: `Name` // необязательно. при добавлении будет как: Name <no-reply@name.domain>
    },
    to: [`example@name.domain`, `else@name.domain`], // < 1000
    subject: `subject`,
    html: `
        <html>
            <head>
                <meta name="viewport" content="width=device-width" />
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Hello world</title>
            </head>
            <body>
                <h1>Hello world!</h1>
                <div>This is an example of an HTML message.</div>
            </body>
        </html>
    `
});


/*
    Отправка текстового письма (text/plain).

    Возвращаемое значение:
        200: {
            id: `message-id`,
            message: `Queued. Thank you.`
        }
        !200: {
            message: `Error description`
        }
*/

const response_text = await bitey.mail.mailgun.send({
    domain: `name.domain`,
    from: {
        email: `no-reply@name.domain`,
        name: `Name` // необязательно. при добавлении будет как: Name <no-reply@name.domain>
    },
    to: [`example@name.domain`, `else@name.domain`], // < 1000
    subject: `subject`,
    text: `Hello world! This is an example of an simple text message.`
});


/*
    Пакетная отправка с использованием переменных получателя.
    Переменные получателя доступны в тексте как %recipient.key%.

    Возвращаемое значение:
        200: {
            id: `message-id`,
            message: `Queued. Thank you.`
        }
        !200: {
            message: `Error description`
        }
*/

const response_batch = await bitey.mail.mailgun.batch({
    domain: `name.domain`,
    from: {
        email: `no-reply@name.domain`,
        name: `Name` // необязательно. при добавлении будет как: Name <no-reply@name.domain>
    },
    to: { // < 1000
        [`bob@name.domain`]: {
            id: 1,
            name: `Bob`
        },
        [`alice@name.domain`]: {
            id: 2,
            name: `Alice`
        }
    },
    subject: `Hey, %recipient.name%`,
    text: `Hello, %recipient.name%! This is an example of an simple text message. If you wish to unsubscribe, click <https://myservice.domain/unsubscribe/%recipient.id%>` // text/html
});