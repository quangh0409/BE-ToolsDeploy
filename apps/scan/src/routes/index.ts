import { Router } from "express";
import { configs } from "../configs";
import { verifyToken } from "../middlewares";

import { router as scanRouter } from "./external/scan.router";
// import { router as scanInRouter } from "./internal/scan.router";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Apis in microservice scan",
            version: "1.0.0",
        },
        servers: [
            {
                url: "http://localhost:6805",
            },
        ],
    },

    apis: ["./src/swagger/swagger.*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export const router: Router = Router();
router.use(
    `${configs.app.prefix}/api-docs`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

router.use(`${configs.app.prefix}/scan`, verifyToken, scanRouter);
// router.use(`${configs.app.prefix}/in/scan`, scanInRouter);
