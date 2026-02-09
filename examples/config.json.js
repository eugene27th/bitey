/*
    this is config.json, but it is in the .js format for the writing comments
*/

const config = {
    "port": 36423, // optional. default: 30000

    "headers": [ // optional. additional headers to be collected in req.headers (lowercase)
        "cookie",
        "session",
        "user-agent"
    ],

    "cors": { // optional. cors parameters
        "origin": [ // allowed origins
            "http://127.0.0.1:3000",
            "https://domain.com"
        ],
        "credentials": true
    },

    "guard": { // optional. global limits for http and ws (by remote_ip)
        "http": [60, 10], // [N requests, in N seconds]
        "ws": [10, [60, 10]] // [N connections , [N messages, in N seconds]]
    },

    "logger": { // optional, if routing logging is needed
        "folder": ".logs", // directory for files. default: ".logs"
        "interval": 10 // the interval for writing logs to a file on disk. default: 10
    },

    "mysql": { // required for `bitey/mysql`. mysql (mariadb client) connection settings
        "host": "127.0.0.1",
        "user": "username",
        "database": "databasename",
        "password": "password",
        "ssl": false,
        "metaAsArray": true,
        "insertIdAsNumber": true,
        "allowPublicKeyRetrieval": true,
        "connectionLimit": 50,
        "connectTimeout": 5000,
        "acquireTimeout": 10000
    },

    "redis": { // required for `bitey/redis`. redis client connection settings
        "host": "127.0.0.1",
        "port": 6379,
        "password": "password"
    }
}