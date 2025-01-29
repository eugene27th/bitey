module.exports = function (app) {
    app.post(`/options`,
        {
            auth: {
                required: 1, // 1 - требуется, 2 - строго не требуется, 0 - всё равно
                permissions: [1, 3]
            },
            schema: {
                body: {
                    type: `application/json`, min: 2, max: 3
                }
            },
            raw: true, // оставить оригинальный raw от пэйлоад в req.raw
            guard: [15, 10], // лимит на роут [n раз, в n секунд]
            turnstile: true, // включить проверку cloudflare turnstile
            log_payload: false // логировать пэйлоад
        },
        async function(res, req) {
            res.send(req);
        }
    );

    app.post(`/example/:hello/:number/:world`, // /example/something/10/else?cat=orange
        {
            auth: {
                required: 0
            },
            schema: {
                params: [
                    {
                        type: `string`, min: 1, max: 64
                    },
                    {
                        type: `int`, min: 1, max: 30
                    },
                    {
                        type: `string`, min: 1, max: 64
                    }
                ],
                query: {
                    properties: {
                        cat: {
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
            res.send(req);
        }
    );

    app.post(`/file/upload`,
        {
            auth: {
                required: 0
            },
            schema: {
                body: {
                    type: `multipart/form-data`,
                    properties: {
                        author: {
                            type: `string`, min: 1, max: 128
                        },
                        files: {
                            required: true,
                            type: `file`, max: 8, size: 32 * 1e6, hash: true,
                            mimetypes: [`image/png`, `image/jpeg`, `image/webp`, `video/mp4`]
                        }
                    }
                }
            },
            log: {
                payload: false
            }
        },
        async function(res, req) {
            res.send(req);
        }
    );
};