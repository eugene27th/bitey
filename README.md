![bitey](https://github.com/user-attachments/assets/0c49172d-7cda-4193-896c-1535a0fddc74)

# Bitey
Lightweight and high-performance web server powered by **uWebSockets.js**.

**Bitey** is designed for lightning-fast creation and deployment of backends and microservices -  
when you need maximum performance with minimal code and dependencies.

Routing and middleware feel similar to Express/Fastify, but it runs **orders of magnitude faster** and uses far less memory.


## Quick start
```bash
npm i github:eugene27th/bitey
```

```js
import { app } from "bitey";

app.get(`/`, {},
    async function(res, req) {
        res.send({ hello: `world` });
    }
);

app.start(); // default port: 30000
```


## Main features
- HTTP and WebSocket routing
- Input validation for params, query, body and messages
- HTTP and WS rate limiting (global and per-route)
- Middleware support for HTTP and WS handlers
- Simple in-memory cache (`bitey/cache`)
- Convenient MySQL wrappers (`bitey/mysql`)
- Pre-connected Redis client (`bitey/redis`)
- Logger with daily rotation (`bitey/logger`)
- Utilities: `tryFetch`, `getDate`, `getTime`, `randomUUIDTS`, `parseCookie`, etc.


## Most real-world patterns and features
- `examples/index.js` - typical project entry point
- `examples/config.json` - full configuration reference
- `examples/controller.http.js` - HTTP routing
- `examples/controller.ws.js` - WebSocket
- `examples/cache.js` - in-memory cache usage
- `examples/mysql.js` - MySQL usage examples
- `examples/redis.js` - Redis usage examples
- `examples/logger.js` - logger usage
- `examples/validator.js` - validation rules for all data types
- `examples/benchmark.js` - minimal working server


## Recommended minimal `config.json`
```js
{
    "port": 36423, // web server port
    "cors": { // if backend is used for frontend
        "origin": [
            "http://localhost:5173",
            "https://your-domain.com"
        ],
        "credentials": true
    },
    "guard": { // global rate limiting
        "http": [60, 10],
        "ws": [10, [30, 10]]
    },
    "logger": { // writing logs
        "folder": ".logs",
        "interval": 10
    }
}
```