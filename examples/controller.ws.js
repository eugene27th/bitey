module.exports = function (app) {
    app.action(`/`, `helloAction`,
        {
            auth: {
                required: 0
            },
            schema: {
                properties: {
                    id: {
                        required: true,
                        type: `int`, min: 0, max: 128
                    },
                    salwa: {
                        type: `string`, min: 5, max: 5
                    }
                }
            }
        },
        async function(ws) {
            if (ws.message.ident !== `0`) {
                ws.send({
                    hello: `world`,
                    message: `Можно отказаться от этого ответа если указать в идентификаторе '0'.`
                });
            };

            ws.send({
                hello: `world`,
                id: ws.message.data.id,
                salwa: ws.message.data.salwa
            });
        }
    );

    app.action(`/`, `subscribeAction`,
        {
            auth: {
                required: 0
            }
        },
        async function(ws) {
            ws.subscribe(`something:room_id=1`);

            ws.send({
                action: `onNewNotification`,
                message: `После подписки на это действие будут прилетать уведомления раз в минуту с указанным действием (каналом).`
            });
        }
    );

    app.action(`/`, `unsubscribeAction`,
        {
            auth: {
                required: 0
            }
        },
        async function(ws) {
            ws.unsubscribe(`something:room_id=1`);

            ws.send({
                message: `Вы успешно отписались!`
            });
        }
    );

    setInterval(function() {
        return app.publish(`something:room_id=1`, `onNewNotification`, {
            name: `Важное оповещение!`,
            message: `Что тут у вас проиходит?`
        });
    }, 60 * 1000);
};