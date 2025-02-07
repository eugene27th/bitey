const middlewareOne = async function(res, req, next) {
    req.middlewareOne = true;
    return next();
};

const middlewareTwo = async function(res, req, next) {
    req.middlewareTwo = true;
    return next();
};


module.exports = function(app) {
    app.post(`/options`,
        {
            config: {
                raw: true, // оставить оригинальный буффер от полезной нагрузки в req.raw
                guard: [15, 10], // лимит на роут [n раз, в n секунд]
                turnstile: true, // включить проверку cloudflare turnstile
                log_payload: false // логировать полезной нагрузки
            },
            middlewares: [middlewareOne, middlewareTwo], // функции, исполняемые перед финальной
            schema: {
                body: {
                    type: `application/json`, min: 2, max: 3
                }
            }
        },
        async function(res, req) {
            console.log(req);

            res.send({
                hello: `world`
            });
        }
    );

    app.post(`/example/:hello/:number/:world`, // /example/something/10/else?cat=orange
        {
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
            config: {
                log_payload: false
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
        },
        async function(res, req) {
            res.send(req);
        }
    );
};