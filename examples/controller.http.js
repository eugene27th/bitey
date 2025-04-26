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
                raw: true, // set original buffer payload in req.raw
                guard: [15, 10], // limit on route [n attempts, in n seconds]
                turnstile: true, // turn on cloudflare turnstile challenge
                log: {
                    headers: true,
                    payload: false
                }
            },
            middlewares: [middlewareOne, middlewareTwo], // executed before final function
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

    app.post(`/payload/:hello/:world`, // /payload/cats/100?meow=murr
        {
            schema: {
                params: [
                    {
                        type: `string`, min: 1, max: 64
                    },
                    {
                        type: `int`, min: 1, max: 30
                    }
                ],
                query: {
                    entries: {
                        meow: {
                            type: `string`, min: 1, max: 128
                        }
                    }
                },
                body: {
                    type: `application/json`, min: 2, max: 3,
                    entries: {
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
                            entries: {
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
                log: {
                    payload: false
                }
            },
            schema: {
                body: {
                    type: `multipart/form-data`,
                    entries: {
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