const app = require(`bitey`).app;

require(`./api/controllers/http/hello`)(app);
require(`./api/controllers/ws/hello`)(app);

app.start();