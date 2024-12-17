module.exports = function (app) {
    app.post(`/hello/:number/something`, // /hello/27/something?example=cat
        {
            auth: {
                required: 0
            },
            schema: {
                params: [
                    {
                        type: `int`, min: 1, max: 30
                    }
                ],
                query: {
                    properties: {
                        example: {
                            type: `string`, min: 1, max: 128
                        }
                    }
                },
                body: {
                    type: `application/json`, min: 2, max: 3,
                    properties: {
                        hello: {
                            required: true,
                            type: `string`, min: 1, max: 128
                        },
                        world: {
                            type: `enum`, enum: [`hello`, `world`]
                        },
                        and: {
                            type: `pattern`, pattern: `uuid`
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
        },
        async function(res, req) {
            res.send(req.params, req.query, req.body);
        }
    );

    app.post(`/hello/getmyfile`,
        {
            auth: {
                required: 0
            },
            schema: {
                body: {
                    type: `multipart/form-data`,
                    properties: {
                        files: {
                            required: true,
                            type: `file`, max: 16, size: 100 * 1e6, hash: true,
                            mimetypes: [`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/svg+xml`, `video/mp4`]
                        }
                    }
                }
            }
        },
        async function(res, req) {
            res.send(req.body);
        }
    );
};