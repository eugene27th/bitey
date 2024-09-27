module.exports = function (app) {
    app.post(`/hello`,
        {
            auth: {
                required: 0
            },
            schema: {
                body: {
                    json: {
                        properties: {
                            hello: {
                                required: true,
                                type: `string`,
                                min: 1,
                                max: 128
                            }
                        }
                    }
                }
            }
        },
        async function(res, req) {
            res.send({
                hello: req.body.json.hello
            });
        }
    );
};