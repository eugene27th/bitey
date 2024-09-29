module.exports = function (app) {
    app.message(`/`, `helloWorld`,
        {
            auth: {
                required: 0
            }
        },
        async function(ws) {
            if (ws.message.ident !== `0`) {
                ws.send({
                    hello: `world`,
                    message: `Можно отказаться от этого ответа если указать в идентификаторе '0'.`
                });
            };
        }
    );

    app.message(`/`, `getMyAccount`,
        {
            auth: {
                required: 0
            }
        },
        async function(ws) {
            ws.send({
                id: 1,
                name: `King Smith`,
                stats: {
                    level: 3,
                    experience: 35,
                    energy: 110,
                    k: 12,
                    i: 12,
                    n: 12,
                    g: 12
                },
                balance: {
                    ton: 87,
                    souls: 492
                }
            });
        }
    );

    app.message(`/`, `getAccount`,
        {
            auth: {
                required: 0
            },
            schema: {
                properties: {
                    id: {
                        required: true,
                        type: `id`
                    }
                }
            }
        },
        async function(ws) {
            ws.send({
                id: ws.message.data.id,
                name: `Sir Christen`,
                stats: {
                    level: 5,
                    experience: 80
                }
            });
        }
    );

    app.message(`/`, `getAccounts`,
        {
            auth: {
                required: 0
            },
            schema: {
                properties: {
                    search: {
                        type: `pat_string_default`,
                        min: 1,
                        max: 256
                    }
                }
            }
        },
        async function(ws) {
            ws.send([
                {
                    id: 1,
                    name: `Sir Christen`,
                    stats: {
                        level: 5,
                        experience: 80
                    }
                },
                {
                    id: 2,
                    name: `Sir Kyle`,
                    stats: {
                        level: 5,
                        experience: 80
                    }
                },
                {
                    id: 3,
                    name: ws.message.data.search,
                    stats: {
                        level: 5,
                        experience: 80
                    }
                }
            ]);
        }
    );

    app.message(`/`, `subscribeNotifications`,
        {
            auth: {
                required: 0
            }
        },
        async function(ws) {
            ws.subscribe(`notification:account_id=1`);

            ws.send({
                action: `onNewNotification`,
                description: `После подписки на это действие будут прилетать уведомления раз в минуту с указанным действием (каналом).`
            });
        }
    );

    app.message(`/`, `unsubscribeNotifications`,
        {
            auth: {
                required: 0
            }
        },
        async function(ws) {
            ws.unsubscribe(`notification:account_id=1`);
            ws.send();
        }
    );

    setInterval(function() {
        return app.publish(`notification:account_id=1`, `onNewNotification`, {
            id: 3,
            title: `Важное оповещение!`,
            description: `Что тут у вас проиходит?`
        });
    }, 60 * 1000);
};