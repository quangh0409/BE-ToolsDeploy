import { Router } from "express";
import { configs } from "../configs";
import { verifyToken } from "../middlewares";

import { router as authRouter } from "./external/auth.router";
import { router as inAccountRouter } from "./internal/account.router";
import { router as userRouter } from "./external/user.router";
import { router as inUserRouter } from "./internal/user.router";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Apis in microservice auth",
            version: "1.0.0",
        },
        servers: [
            {
                url: "http://localhost:6801",
            },
        ],
    },

    apis: ["./src/swagger/swagger*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export const router: Router = Router();
router.use(
    `${configs.app.prefix}/api-docs`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);
router.use(`${configs.app.prefix}/auth`, authRouter);
router.use(`${configs.app.prefix}/in/accounts`, inAccountRouter);

router.use(`${configs.app.prefix}/users`, userRouter);
router.use(`${configs.app.prefix}/in/users`, inUserRouter);
