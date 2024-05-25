import createApp from "app";
import { router } from "./routers";
import { configs } from "./configs";
import logger from "logger";

function main(): void {
    const app = createApp(router, configs);
    const host = configs.app.host;
    const port = configs.app.port;

    const startApp = (): void => {
        app.listen(Number(port), host, () => {
            logger.info("Listening on: %s:%d", host, port);
        });
    };
    startApp();
}

main();
