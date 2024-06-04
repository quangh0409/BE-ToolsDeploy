import createApp from "app";
import fs from "fs";
import { router } from "./routes";
import { configs } from "./configs";
import logger from "logger";
import { createServer } from "http";
import { createServer as https } from "https";
import {
    connectedToMongo,
    connectedToRedis,
    connectMongo,
    connectRedis,
} from "./database";
import { SocketServer } from "./utils";
import cookieParser from "cookie-parser";
function main(): void {
    const app = createApp(router, configs);
    const host = configs.app.host;
    const port = configs.app.port;

    // // config socket
    app.use(cookieParser()); // For cookie parsing
    const server = createServer(app);
    const serverhttps = https(
        {
            key: fs.readFileSync("/etc/ssl/private/toolsdeploybe.key"),
            cert: fs.readFileSync("/etc/ssl/certs/toolsdeploybe.crt"),
        },
        app
    );
    SocketServer.setInstance(serverhttps)
    // SocketServer.setInstance(server);

    const startApp = (): void => {
        server.listen(Number(port), host, () => {
            logger.info("Listening on: %s:%d", host, port);
        });
        serverhttps.listen(443, host, () => {
            logger.info("Listening on: %s:%d", host, 443);
        });
        const SmeeClient = require("smee-client");

        const smee = new SmeeClient({
            source: "https://smee.io/NEsyf7sKQOTJ8tOk/",
            target: "http://127.0.0.1:6804/api/v1/webhook/",
            logger: console,
        });

        smee.start();
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
