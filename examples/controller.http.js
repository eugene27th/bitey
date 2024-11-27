module.exports = function (app) {
    app.post(`/hello/:world`,
        {
            auth: {
                required: 0
            },
            schema: {
                params: [
                    {
                        type: `uint`
                    }
                ],
                body: {
                    json: {
                        min: 2,
                        properties: {
                            hello: {
                                required: true,
                                type: `string`,
                                min: 1,
                                max: 128
                            },
                            world: {
                                type: `enum`,
                                enum: [`hello`, `world`]
                            },
                            and: {
                                type: `pattern`,
                                pattern: `uuid`
                            },
                            salwa: {
                                type: `object`,
                                properties: {
                                    balbes: {
                                        required: true,
                                        type: `boolean`
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        async function(res, req) {
            res.send(req.params, req.body.json);
        }
    );

    app.get(`/hello-with-query-params`, // ?example=something
        {
            auth: {
                required: 0
            },
            schema: {
                query: {
                    properties: {
                        example: {
                            type: `string`,
                            min: 1,
                            max: 128
                        }
                    }
                }
            }
        },
        async function(res, req) {
            res.send(req.query);
        }
    );

    app.post(`/hello/getmyfile`,
        {
            auth: {
                required: 0
            },
            schema: {
                body: {
                    form: {
                        properties: {
                            files: {
                                required: true,
                                type: `file`,
                                max: 16,
                                mimetypes: [`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/svg+xml`, `video/mp4`],
                                size: 100 * 1e6,
                                hash: true
                            }
                        }
                    }
                }
            }
        },
        async function(res, req) {
            res.send(req.body.form);
        }
    );
};