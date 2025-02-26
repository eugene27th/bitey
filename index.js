const uws = require(`uWebSockets.js`);


let app = uws.App();

require(`./dist/http`)(app);
// todo: require(`./dist/ws`)(app);

app.start = function() {
    app.listen(require(`${process.cwd()}/config.json`).port, function(token) {
        token ? console.log(`webserver started`) : console.log(`webserver not started`);
    });
};


module.exports = {
    app,
    cache: require(`./dist/cache`),
    cookie: require(`./dist/cookie`),
    error: require(`./dist/error`),
    fetch: require(`./dist/fetch`),
    logger: require(`./dist/logger`),
    mysql: require(`./dist/mysql`),
    redis: require(`./dist/redis`),
    session: require(`./dist/session`),
    utils: require(`./dist/utils`),
    validator: require(`./dist/validator`)
};