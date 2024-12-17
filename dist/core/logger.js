const utils = require(`./utils`);
const fs = require(`fs/promises`);


const log = async function(log, in_console) {
    const path = `logs/${utils.date(`m.y`)}`;

    try {
        await fs.access(path);
    } catch (error) {
        if (error.code !== `ENOENT`) {
            throw error;
        };

        try {
            await fs.mkdir(path, { recursive: true });
        } catch (error) {
            throw error;  
        };
    };

    log = `[${utils.time()}] ${log}`;

    if (in_console) {
        console.log(log);
    };

    return await fs.appendFile(`${path}/${utils.date()}.log`, `${log}\n`);
};

const http = async function(req) {
    if (!req.options.schema) {
        return await logger.log(`[HTTP] [${req.method}] [${req.url}] [${req.headers.ip}] [${req.session?.account.id || `NULL`}]`);
    };

    if (!req.options.log.body) {
        return await logger.log(`[HTTP] [${req.method}] [${req.url}] [${req.headers.ip}] [${req.session?.account.id || `NULL`}] [${JSON.stringify({ params: req.params, query: req.query })}]`);
    };

    if (!req.options.log.bankeys) {
        return await logger.log(`[HTTP] [${req.method}] [${req.url}] [${req.headers.ip}] [${req.session?.account.id || `NULL`}] [${JSON.stringify({ params: req.params, query: req.query, body: req.body })}]`);
    };

    // todo: bankeys
};


module.exports = {
    log,
    http
};