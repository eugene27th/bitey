const uws = require(`uWebSockets.js`);


const app = uws.App();

require(`./dist/http`)(app);
require(`./dist/ws`)(app);

app.start = function() {
    app.listen(require(`${process.cwd()}/config.json`).port, function(token) {
        token ? console.log(`webserver started`) : console.log(`webserver not started`);
    });
};


module.exports = {
    app,
    cache: require(`./dist/cache`),
    error: require(`./dist/error`),
    logger: require(`./dist/logger`),
    mysql: require(`./dist/mysql`),
    redis: require(`./dist/redis`),
    utils: require(`./dist/utils`),
    validator: require(`./dist/validator`)
};