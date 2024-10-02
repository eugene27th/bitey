/*
    Инициализация фрамеворка.
    Для использования модулей в конфиге нужно указать необходимые для них параметры.
*/

const app = require(`bitey`).app;

require(`./api/controllers/http/hello`)(app);
require(`./api/controllers/ws/hello`)(app);

app.start();