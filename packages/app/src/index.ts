import express, { Application, Router } from "express";
import { notFoundMiddlewares } from "./middlewares/result";
import {
    resultMiddlewares,
    parserMiddlewares,
    securityMiddlewares,
    handleValidation,
    requestInitialization,
    validate,
} from "./middlewares";
import "express-async-errors";
import { AppConfigurations, configAxios, configLogger } from "./configs";

const createApp = (
    applicationRouter: Router,
    configs: AppConfigurations
): Application => {
    const env = configs.environment;
    configLogger(configs);
    configAxios(configs);
    const app: Application = express();
    app.use(securityMiddlewares);
    app.use(parserMiddlewares);
    app.use(requestInitialization);
    app.use(applicationRouter);
    app.use(notFoundMiddlewares);
    app.use(resultMiddlewares(env));
    return app;
};

export default createApp;
export * from "./result";
export * from "./error";
export * from "./request";
export * from "./constant";
export { handleValidation, validate };
