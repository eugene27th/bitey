const middlewareUpgrade = async function(res, req, next) {
    req.middlewareUpgrade = true;
    return next();
};

const middlewareMessage = async function(ws, next) {
    ws.middlewareMessage = true;
    return next();
};


module.exports = function (app) {
    app.message(`/pubsub`,
        {
            config: {
                guard: [5, [15, 10]], // limit [n connections, [n messages, in n seconds]]
                log: {
                    headers: true,
                    payload: true,
                    messages: true,
                    connections: true
                }
            },
            middlewares: {
                upgrade: [middlewareUpgrade], // executed in upgrade when creating a connection
                message: [middlewareMessage] // executed before final handler in message
            },
            schema: {
                min: 1, max: 2,
                entries: {
                    action: {
                        type: `enum`, enum: [`sub`, `unsub`]
                    },
                    data: {
                        required: true,
                        type: `string`, min: 1, max: 128
                    }
                }
            }
        },
        async function(ws) {
            console.log(ws);

            if (ws.message.action === `sub`) {
                ws.subscribe(`room:1`);
            };

            if (ws.message.action === `unsub`) {
                ws.unsubscribe(`room:1`);
            };

            ws.send(JSON.stringify({
                type: `send`,
                action: ws.message.action || null
            }));
        }
    );

    setInterval(function() {
        return app.publish(`room:1`, JSON.stringify({
            type: `publish`,
            message: `something update`
        }));
    }, 10 * 1000);
};