// autocannon -c 100 -d 40 -p 10 localhost:3000

const app = require(`bitey`).app;

app.get(`/`, {},
    async function(res, req) {
        res.send({ hello: `world` });
    }
);

app.start();