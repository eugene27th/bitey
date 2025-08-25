const config = require(`${process.cwd()}/config.json`);

const utils = require(`./utils`);
const fs = require(`fs/promises`);


let stack = ``;

const write = async function() {
    if (stack === ``) {
        return false;
    };

    const path = `${config.logger.folder}/${utils.get.date(`m.y`)}`;

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

    fs.appendFile(`${path}/${utils.get.date()}.log`, stack);

    stack = ``;
};

const log = function(text, in_console) {
    stack += `[${utils.get.time()}] ${text}\n`;

    if (in_console) {
        console.log(text);
    };
};


setInterval(write, config.logger?.interval * 1000 || 10000);


module.exports = {
    log
};