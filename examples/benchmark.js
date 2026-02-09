/*
    autocannon -c 100 -d 40 -p 10 localhost:30000
*/

import { app } from "bitey";

app.get(`/`, {},
    async function(res, req) {
        res.send({ hello: `world` });
    }
);

app.start();