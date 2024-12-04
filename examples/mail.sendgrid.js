/*
    Отправка HTML письма (text/html).

    Возвращаемое значение: {
        errors: null или []
    }
*/

const response_html = await bitey.mail.sendgrid.send({
    domain: `name.domain`,
    from: {
        email: `no-reply@name.domain`,
        name: `Name` // необязательно. при добавлении будет как: Name <no-reply@name.domain>
    },
    to: [`example@name.domain`, `else@name.domain`],
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
    
    Возвращаемое значение: {
        errors: null или []
    }
*/

const response_text = await bitey.mail.sendgrid.send({
    domain: `name.domain`,
    from: {
        email: `no-reply@name.domain`,
        name: `Name` // необязательно. при добавлении будет как: Name <no-reply@name.domain>
    },
    to: [`example@name.domain`, `else@name.domain`],
    subject: `subject`,
    text: `Hello world! This is an example of an simple text message.`
});