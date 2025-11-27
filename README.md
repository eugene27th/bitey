# Bitey

Bitey — лёгкий веб-фреймворк на основе `uWebSockets.js`, похожий по API на `express`/`fastify`, оптимизированный для высокой производительности и малого потребления памяти.

![bitey](https://github.com/user-attachments/assets/0c49172d-7cda-4193-896c-1535a0fddc74)

## Краткое описание возможностей

- Быстрый HTTP-сервер поверх `uWebSockets.js`.
- Встроенная маршрутизация: `app.get`, `app.post`, `app.patch`, `app.del`.
- Глобальные и маршрутные лимиты запросов (rate limiting).
- Валидация входных данных (params, query, body) через простую схему.
- Логирование запросов, ошибок, нагрузки, заголовков, подключений, сообщений.
- Поддержка WebSocket с подпиской/публикацией сообщений.
- Поддержка Middleware для HTTP и WebSocket (upgrade/message).
- Простая кэш-система в памяти (`bitey.cache`) и логирование (`bitey.logger`).
- Адаптеры для MySQL (`bitey.mysql`) и Redis (`bitey.redis`) (опционально, в зависимости от `config.json`).
- Утилиты: UUID/UUIDts, генерация строк, cookie-парсер/сериалайзер, retry fetch.

## Быстрый старт

1. Установите bitey:

```bash
npm i github:eugene27th/bitey
```

2. Создайте `config.json` в корне проекта (пример в `examples/config.json`):

```javascript
{
    "port": 30000,

    "headers": [ // опционально
        "cookie",
        "session",
        "user-agent"
    ],

    "cors": { // опционально
        "origin": [
            "http://127.0.0.1:3000",
            "https://domain.com"
        ],
        "credentials": true
    },

    "guard": { // опционально
        "http": [60, 10],
        "ws": [10, [60, 10]]
    },

    "logger": {
        "folder": ".logs",
        "interval": 10
    },

    "mysql": { // опционально
        "host": "127.0.0.1",
        "user": "username",
        "database": "databasename",
        "password": "password",
        "connectionLimit": 10,
        "metaAsArray": true,
        "insertIdAsNumber": true,
        "waitForConnections": true,
        "queueLimit": 0,
        "multipleStatements": true
        // и прочие
    },
    
    "redis": { // опционально
        "host": "127.0.0.1",
        "port": 6379,
        "password": "password"
        // и прочие
    }
}
```

3. Создайте файл сервера (пример `examples/index.js`):

```javascript
const bitey = require(`bitey`);
const app = bitey.app;

// Подключите контроллеры
require(`./api/controllers/http/hello`)(app);
require(`./api/controllers/ws/hello`)(app);

app.start();
```

4. Пример HTTP-роута (см. `examples/controller.http.js`):

```javascript
app.post(`/helloworld`,
    {
        config: {
            buffer: true, // оставить оригинальный буффер нагрузки в req.buffer
            guard: [15, 10], // лимит на маршрут [n запросов, в n секунд]
            log: {
                headers: true, // логировать заголовки
                payload: true // логировать нагрузку
            }
        },
        middlewares: [middlewareOne, middlewareTwo], // массив middleware функций
        schema: {
            body: {
                type: `application/json`, min: 2, max: 3
            }
        }
    },
    async function(res, req) {
        // req.params, req.query, req.body доступны если заданы в схеме
        console.log(req);

        res.send({
            hello: `world`
        });
    }
);


// Middleware примеры:
const middlewareOne = async function(res, req, next) {
    req.middlewareOne = true;
    return next();
};

const middlewareTwo = async function(res, req, next) {
    req.middlewareTwo = true;
    return next();
};
```

5. Пример WebSocket-роута (см. `examples/controller.ws.js`):

```javascript
app.message(`/pubsub`,
    {
        config: {
            guard: [5, [15, 10]], // лимит на маршрут [n соединений, [n запросов, в n секунд]]
            log: {
                headers: true, // логировать заголовки
                payload: true, // логировать нагрузку
                messages: true, // логировать сообщения
                connections: true // логировать подключения/отключения
            }
        },
        middlewares: {
            upgrade: [middlewareUpgrade], // выполнится в upgrade при создании подключения
            message: [middlewareMessage] // выполнится перед финальным обработчиком сообщений
        },
        schema: {
            min: 1, max: 2,
            entries: {
                action: {
                    type: `enum`, enum: [`sub`, `unsub`]
                },
                data: {
                    required: true,
                    type: `string`, min: 1, max: 128
                }
            }
        }
    },
    async function(ws) {
        // при подключении ws содержит: ws.user, ws.url, ws.config, ws.schema
        // ws.message содержит уже распарсенные и проверенные данные
        console.log(ws);

        if (ws.message.action === `sub`) {
            ws.subscribe(`room:1`);
        };

        if (ws.message.action === `unsub`) {
            ws.unsubscribe(`room:1`);
        };

        ws.send(JSON.stringify({
            type: `send`,
            action: ws.message.action || null
        }));
    }
);


// Публикация от сервера:
setInterval(function() {
    return app.publish(`room:1`, JSON.stringify({
        type: `publish`,
        message: `something update`
    }));
}, 10 * 1000);


// Middleware примеры:
const middlewareUpgrade = async function(res, req, next) {
    req.middlewareUpgrade = true;
    return next();
};

const middlewareMessage = async function(ws, next) {
    ws.middlewareMessage = true;
    return next();
};
```

## API и поведение

Подключение: `const bitey = require(`bitey`)` экспортирует объект:
 - `bitey.app` — приложение uWebSockets (добавлены обёртки `app.get/post/patch/del` и `app.message`)
 - `bitey.cache` — простой in-memory cache: `get`, `set`, `del`
 - `bitey.error` — класс ошибок `api(status, code, extra)` для выбрасывания контроллером
 - `bitey.logger` — `log(text)` (и автоматическое сохранение в папку из `config.logger`)
 - `bitey.mysql` — `exe`, `get`, `ins`, `upd`, `del` (если задан `mysql` в `config.json`)
 - `bitey.redis` — клиент `@redis/client` (если задан `redis` в `config.json`)
 - `bitey.utils` — `fetch` (с retry), `create.uuid`, `create.uuidts`, `cookie.parse/serialize`, `get.date/time/timestamp`
 - `bitey.validator` — `value`, `array`, `json`, `error()`

### HTTP роуты
Объявление: `app.get/post/patch/del(url, options, handler)`

```javascript
options = {
    config: {
        buffer: true, // boolean, сохранять raw buffer в req.buffer
        guard: [n, s], // лимит на маршрут: n запросов за s секунд
        log: {
            headers: true, // boolean, логировать заголовки
            payload: true // boolean, логировать данные
        }
    },
    middlewares: [async function(res, req, next) { ... }, ...], // массив функций выполняемых перед handler
    schema: { // валидация запроса (см. `examples/controller.http.js` и `examples/validator.js`)
        params: { ... }, // валидация параметров пути
        query: { ... }, // валидация query строки
        body: { ... } // валидация тела запроса
    }
}

handler = async function(res, req) {
    // в req доступны: req.headers, req.user.ip, req.params, req.query, req.body, req.buffer (если buffer: true)

    res.setHeader(`content-type`, `application/json`); // отложенная установка заголовка

    res.send({ hello: `world` }); // отправка JSON с кодом 200
    res.send(`hello world`, 201); // отправка строки с кодом 201
    res.send(null, 204); // отправка ответа без тела с кодом 204

    res.redirect(`https://domain.com`); // ответ 302
}
```

### WebSocket
Регистрация: `app.message(url, options, handler)`

```javascript
options = {
    config: {
        guard: [c, [n, s]], // лимит на маршрут: c соединений, n запросов за s секунд
        log: {
            headers: true, // boolean, логировать заголовки
            payload: true, // boolean, логировать данные
            messages: true, // boolean, логировать сообщения
            connections: true // boolean, логировать подключения/отключения
        }
    },
    middlewares: {
        upgrade: [async function(res, req, next) { ... }, ...], // массив функций выполняемых при установке соединения
        message: [async function(ws, next) { ... }, ...] // массив функций выполняемых перед handler
    },
    schema: { ... } // валидация сообщения (см. `examples/controller.ws.js` и `examples/validator.js`)
}

handler = async function(ws) {
    // в ws доступны: ws.user, ws.url, ws.config, ws.schema, ws.message (распарсенная нагрузка)

    ws.subscribe(topic); // подписка на тему
    ws.unsubscribe(topic); // отписка от темы

    ws.send(JSON.stringify({ type: `send`, message: `hello world` })); // отправка сообщения клиенту
}
```

Публикация сообщений всем подписанным клиентам на тему:
```javascript
app.publish(topic, JSON.stringify({ type: `publish`, message: `update` }));
```

### Конфигурация
Проект ожидает `config.json` в корне (см. `examples/config.json`).
```javascript
{
    "port": 30000, // порт сервера
    "headers": [ ... ], // дополнительные заголовки, которые будут собраны в req.headers (опционально)
    "cors": { ... }, // параметры CORS (разрешённые origin и credentials) (опционально)
    "guard": { ... }, // глобальные лимиты для http и ws (опционально)
    "logger": { ... }, // путь и интервал записи логов
    "mysql": { ... }, // блок для подключения к MySQL (опционально)
    "redis": { ... } // блок для подключения к Redis (опционально)
}
```

### Кэш
- Экспорт: `bitey.cache` с методами `get(key)`, `set(key, value, ttl)`, `del(key)`.
- См. `examples/cache.js` для подробностей.

### Валидация
- Используйте `schema` в роутинге, либо напрямую `bitey.validator.value/array/json`.
- При ошибке `bitey.validator.error()` возвращает текст ошибки.
- См. `examples/validator.js` для подробностей.

### MySQL
- Экспорт: `bitey.mysql` с методами `exe`, `get`, `ins`, `upd`, `del`.
- Подключается автоматически если есть `mysql` в `config.json`.
- См. `examples/mysql.js` для подробностей.

### Redis
- Экспорт: `bitey.redis` — это `@redis/client`.
- Подключается автоматически если есть `redis` в `config.json`.
- См. `examples/redis.js` для подробностей.