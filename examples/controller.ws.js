/*
    middleware functions
*/

const middlewareUpgrade = async function(res, req, next) {
    req.middlewareUpgrade = true;
    return next();
};

const middlewareMessage = async function(ws, next) {
    ws.middlewareMessage = true;
    return next();
};


export default function (app) {
    app.message(`/pubsub`,
        {
            config: {
                guard: [5, [15, 10]], // limit [n connections, [n messages, in n seconds]]
                log: {
                    headers: true, // log headers (when creating a connection)
                    payload: true, // log body payload (when creating a connection)
                    messages: true, // log messages
                    connections: true // log connections
                }
            },
            middlewares: {
                upgrade: [middlewareUpgrade], // array of middleware functions. executed in upgrade when creating a connection
                message: [middlewareMessage] // array of middleware functions. executed before final handler in message
            },
            schema: {
                min: 1, max: 2, // optional
                entries: {
                    /*
                        simple basic examples.
                        you will find detailed information about the types and parameters in the files `validator.js` or `controller.http.js`
                    */
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
            
            /*
                ws: {
                    ...,
                    message: {
                        action: `sub`,
                        data: `value`
                    }
                }
            */

            if (ws.message.action === `sub`) {
                ws.subscribe(`room:1`);
            };

            if (ws.message.action === `unsub`) {
                ws.unsubscribe(`room:1`);
            };

            /*
                sending a response when creating a connection
            */
            ws.send(JSON.stringify({
                type: `send`, // just an example
                action: ws.message.action || null
            }));
        }
    );

    setInterval(function() {
        /*
            publishing from the server
        */
        return app.publish(`room:1`, JSON.stringify({
            type: `publish`, // just an example
            message: `something update`
        }));
    }, 10 * 1000);
};