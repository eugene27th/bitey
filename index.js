const uws = await import(`uWebSockets.js`);

import { wsSetup } from "./dist/ws.js";
import { httpSetup } from "./dist/http.js";
import { getConfig } from "./dist/utils.js";

export const app = uws.App();

wsSetup(app);
httpSetup(app);

app.start = function() {
    const config = getConfig();

    app.listen(config.port || 30000, function(token) {
        token ? console.log(`webserver started`) : console.log(`webserver not started`);
    });
};