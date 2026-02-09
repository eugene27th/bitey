/*
    preferably set up `logger` section in config.js
*/

import { appendLog } from "bitey/logger";


/*
    append example
    - args: message (string), show log in console (boolean, default: false)
*/

appendLog(`your message in log file`);
appendLog(`your message in log file and in console`, true);