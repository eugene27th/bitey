/*
    Отправка HTML письма.
*/

const response_html = await bitey.mail.mailgun.send({
    domain: `name.domain`,
    from: `MyName <no-reply@name.domain>`,
    to: `example@gmail.com`,
    subject: `Example message`,
    html: `
        <html>
            <head>
                <meta name="viewport" content="width=device-width" />
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Something</title>
            </head>
            <body>
                <h1>Hello world!</h1>
                <div>This is an example of an HTML message.</div>
            </body>
        </html>
    `
});


/*
    Отправка текстового письма.
*/

const response_text = await bitey.mail.mailgun.send({
    domain: `name.domain`,
    from: `MyName <no-reply@name.domain>`,
    to: `example@gmail.com`,
    subject: `Example message`,
    text: `Hello world! This is an example of an simple text message.`
});