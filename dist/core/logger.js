const utils = require(`./utils`);
const fs = require(`fs/promises`);


const log = async function(log, in_console) {
    let path = `logs/${utils.date(`m.y`)}`;

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


module.exports = {
    log
};