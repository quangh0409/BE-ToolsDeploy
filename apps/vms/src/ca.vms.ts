import createApp from "app";
import { router } from "./routes";
import { configs } from "./configs";
import logger from "logger";
import fs from "fs";
import { createServer } from "http";
import { createServer as createServerHttps } from "https";
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

    // Define the file paths
    const keyPath = "/etc/ssl/private/toolsdeploysocket.key";
    const certPath = "/etc/ssl/certs/toolsdeploysocket.crt";

    // Check if the key file exists
    if (fs.existsSync(keyPath)) {
        console.log(`Key file exists: ${keyPath}`);
    } else {
        console.log(`Key file does not exist: ${keyPath}`);
    }

    // Check if the certificate file exists
    if (fs.existsSync(certPath)) {
        console.log(`Certificate file exists: ${certPath}`);
    } else {
        console.log(`Certificate file does not exist: ${certPath}`);
    }

    // // config socket
    app.use(cookieParser()); // For cookie parsing
    const server = createServer(app);
    SocketServer.setInstance(server);
    const serverhttps = createServerHttps(
        {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
            requestCert: false,
            rejectUnauthorized: false,
        },
        app
    );
    const startApp = (): void => {
        server.listen(Number(port), host, () => {
            logger.info("Listening on: %s:%d", host, port);
        });

        serverhttps.listen(Number(6814), host, () => {
            logger.info("Listening on: %s:%d", host, port);
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
