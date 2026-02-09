/*
    preferably set up `port`, `cors` and `guard` sections in config.js
*/

import { app } from "bitey";

import httpController from "./api/controllers/http/hello.js";
import wsController from "./api/controllers/ws/hello.js";

httpController(app);
wsController(app);

app.start();