import createApp from "app";
import { router } from "./routes";
import { configs } from "./configs";
import logger from "logger";
import { createServer } from "http";
import {
    connectedToMongo,
    connectedToRedis,
    connectMongo,
    connectRedis,
} from "./database";
import { SocketServer } from "./utils";
function main(): void {
    const app = createApp(router, configs);
    const host = configs.app.host;
    const port = configs.app.port;

    // // config socket
    const server = createServer(app);
    SocketServer.setInstance(server);

    const SmeeClient = require("smee-client");

    const smee = new SmeeClient({
        source: "https://smee.io/NEsyf7sKQOTJ8tO",
        target: "http://localhost:6804/webhooks",
        logger: console,
    });

    smee.start();

    const startApp = (): void => {
        server.listen(Number(port), host, () => {
            logger.info("Listening on: %s:%d", host, port);
        });
    };
    connectMongo(() => {
        if (connectedToRedis()) {
            startApp();
        }
    });
    connectRedis(() => {
        if (connectedToMongo()) {
            startApp();
        }
    });
}

main();
