import { apiError } from "bitey/error";


/*
    middleware functions
*/

const middlewareOne = async function(res, req, next) {
    req.middlewareOne = true;
    return next();
};

const middlewareTwo = async function(res, req, next) {
    req.middlewareTwo = false;
    return next();
};


export default function(app) {
    /*
        GET /regular/get
    */

    app.get(`/regular/get`,
        {
            config: {
                buffer: true, // set original buffer payload in req.buffer
                guard: [15, 10], // limit [n requests, in n seconds]
                log: {
                    headers: true, // log headers
                    payload: true // log body payload
                }
            },
            middlewares: [middlewareOne, middlewareTwo], // array of middleware functions. executed before final handler
            schema: {
                body: {
                    type: `application/json`, min: 2, max: 3
                }
            }
        },
        async function(res, req) {
            console.log(req);

            /*
                req: {
                    ...,
                    middlewareOne: true,
                    middlewareTwo: false
                }
            */

            res.send({
                hello: `world`
            });
        }
    );


    /*
        POST /simple/post
    */

    app.post(`/simple/post`,
        {
            /*
                if you want any payload to be accepted without validation, it is enough to specify type of expected body
            */
            schema: {
                body: {
                    type: `application/json`,
                    min: 2, max: 3 // optional
                }
            }
        },
        async function(res, req) {
            console.log(req);

            /*
                req: {
                    ...,
                    body: {
                        any: `keys`
                    }
                }
            */

            res.send(`hello`);
        }
    );


    /*
        PATCH /harder/cat/220?meow=murr

        BODY (application/json): {
            key1: `value`,
            key2: 128,
            key3: `hello`,
            key4: `1466774a-3c4d-4f99-9036-f57a063c2e6f`,
            key5: `author - name`,
            key6: {
                key7: true
            }
        }
    */

    app.patch(`/harder/:hello/:world`,
        {
            schema: {
                /*
                    simple basic examples.
                    you will find detailed information about the types and parameters in the file `validator.js`
                */
                params: [
                    {
                        type: `string`, min: 1, max: 64
                    },
                    {
                        type: `int`,
                        string: true, // this means that we allow the value in a string format
                        min: 210, max: 230
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
                        key1: { // regular but strictly required string
                            required: true,
                            type: `string`, min: 1, max: 128
                        },
                        key2: { // regular uint (more than zero)
                            type: `unit`, max: 256
                        },
                        key3: { // enum - selection from the available
                            type: `enum`, enum: [`hello`, `world`]
                        },
                        key4: { // pattern from set
                            type: `pattern`, pattern: `uuid`
                        },
                        key5: { // own pattern
                            type: `pattern`, pattern: /^[\p{L}\p{N} _.,!'()&+-]+ - [\p{L}\p{N} _.,!'()&+-]+$/u
                        },
                        key6: { // nested object (infinite nesting)
                            type: `object`,
                            entries: {
                                key7: { // boolean value
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
            console.log(req);

            if (key3 !== `hello`) {
                /* this will return a response with the status 403, and an object { error: `ER_ACCESS_DENIED`, message: `detailed message` } */
                throw new apiError(403, `ER_ACCESS_DENIED`, {
                    message: `detailed message` // optional
                });
            };

            /*
                req: {
                    ...,
                    params: [`cat`, `220`],
                    query: {
                        meow: `murr`
                    },
                    body: {
                        key1: `value`,
                        key2: 128,
                        key3: `hello`,
                        key4: `1466774a-3c4d-4f99-9036-f57a063c2e6f`,
                        key5: `author - name`,
                        key6: {
                            key7: true
                        }
                    }
                }
            */

            res.send(204);
        }
    );


    /*
        POST /file/upload
        
        BODY (multipart/form-data):
            author: `name`
            files: [file, ...]
    */

    app.post(`/file/upload`,
        {
            config: {
                log: {
                    payload: false // it is better to turn off load logging when receiving files
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
                            type: `file`,
                            max: 8, // maximum number of files per request
                            mime: [`image/png`, `image/jpeg`, `image/webp`, `video/mp4`], // allowed mimetypes. simple mimetype check, use your solution to strictly verify the file
                            size: 32 * 1e6, // maximum size of each file in bytes
                            hash: true // calculate the md5 hash of the file and attach it in the response
                        }
                    }
                }
            },
        },
        async function(res, req) {
            console.log(req);

            /*
                req: {
                    ...,
                    body: {
                        author: `name`,
                        files: [
                            {
                                name: `filename`,
                                mime: `image/png`,
                                size: 123123123, // bytes
                                buffer: buffer, // file buffer
                                hash: `md5hash` // file md5 hash
                            }
                        ]
                    }
                }
            */

            res.send(204);
        }
    );


    /* working with the response object */

    app.get(`/working/with/response`, {},
        function(res, req) {
            console.log(req);

            /*
                delayed header installation. it will be sent when res.send() is used.
                this is necessary to set the header before setting the response status.
            */
            res.setDelayedHeader(`content-type`, `application/json`); 

            /* all original uwebsockets.js responses from the server must be in cork */
            res.cork(function() {
                /*
                    setting response status.
                    (!) must be installed first in the response (!)
                */
                res.writeStatus(`200`);

                /* setting header */
                res.writeHeader(`content-type`, `application/json`);

                /* send response */
                res.write();

                /* completing the connection */
                res.end();
                res.endWithoutBody();
                res.tryEnd();
                res.close();

                /* and others, see the documentation uwebsockets.js */
            });

            res.send(); // answer is 204 without a body (body is completely missing)
            res.send(403); // answer is 403 without a body (body is completely missing)
            res.send(`value`); // response is 200 with the string `value`
            res.send(`value`, 400); // response is 400 with the string `value`
            res.send({ json: true }); // response is 200 with json `{ "json": true }` and the header `content-type`: `application/json`
            res.send({ json: true }, 400); // response is 400 with json `{ "json": true }` and the header `content-type`: `application/json`

            res.redirect(`https://domain.com`); // response is 302 with the header `location`: `https://domain.com`
        }
    );
};