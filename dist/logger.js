const config = require(`${process.cwd()}/config.json`);

const utils = require(`./utils`);
const fs = require(`fs/promises`);


let stack = ``;

const write = async function() {
    if (stack === ``) {
        return false;
    };

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

    fs.appendFile(`${path}/${utils.date()}.log`, stack);

    stack = ``;
};

const log = function(text, in_console) {
    stack += `[${utils.time()}] ${text}\n`;

    if (in_console) {
        console.log(text);
    };
};

const http = function(req) {
    let text = `http:${req.method} > ${req.headers[`cf-connecting-ip`] || `unknown ip`}${req.session?.account.id ? `#${req.session.account.id}` : ``} > ${req.url}`;

    if (req.options.config.log?.headers) {
        text += ` > headers: ${JSON.stringify(req.headers)}`;
    };

    if (req.options.config.log?.payload && req.options.schema) {
        text += ` > payload: ${JSON.stringify({ params: req.params, query: req.query, body: req.body })}`;
    };

    return log(text);
};


setInterval(write, config.logger?.interval * 1000 || 10000);


module.exports = {
    log,
    http
};