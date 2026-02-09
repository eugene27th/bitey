import { join as joinPath } from "path";
import { getConfig, getDate, getTime } from "./utils.js";
import { mkdir as fsMakeDir, appendFile as fsAppendFile, access as fsAccess } from "fs/promises";

const config = getConfig();

const logFolder = config.logger?.folder || `.logs`;
const logInterval = config.logger?.interval * 1000 || 10000;

let stack = ``;


const writeLogToFile = async function() {
    if (stack === ``) {
        return false;
    };

    const fileDir = joinPath(logFolder, getDate(`m.y`));

    try {
        await fsAccess(fileDir);
    } catch (error) {
        if (error.code !== `ENOENT`) {
            throw error;
        };

        try {
            await fsMakeDir(fileDir, { recursive: true });
        } catch (error) {
            throw error;
        };
    };

    fsAppendFile(joinPath(fileDir, `${getDate()}.log`), stack);

    stack = ``;
};

export const appendLog = function(text, inConsole) {
    stack += `[${getTime()}] ${text}\n`;

    if (inConsole) {
        console.log(text);
    };
};


setInterval(writeLogToFile, logInterval);