import createApp from "app";
import { router } from "./routes";
import { configs } from "./configs";
import logger from "logger";
import {
    connectedToMongo,
    connectedToRedis,
    connectMongo,
    connectRedis,
} from "./database";

function main(): void {
    const app = createApp(router, configs);
    const host = configs.app.host;
    const port = configs.app.port;

    const startApp = (): void => {
        app.listen(Number(port), host, () => {
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
