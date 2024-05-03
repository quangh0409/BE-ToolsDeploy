import { Router } from "express";
import { configs } from "../configs";

import { router as vmsRouter } from "./external/vms.router";
import { router as serviceRouter } from "./external/service.router";
import { router as webhooksRouter } from "./external/webhook.router";
import { router as postmanRouter } from "./external/postman.router";
import { router as recordRouter } from "./external/record.router";
// import { router as vmsInRouter } from "./internal/vms.router";
import { verifyToken } from "../middlewares";

export const router: Router = Router();
router.use(`${configs.app.prefix}/vms`, verifyToken, vmsRouter);
router.use(`${configs.app.prefix}/services`, verifyToken, serviceRouter);
router.use(`${configs.app.prefix}/webhook`, webhooksRouter);
router.use(`${configs.app.prefix}/postman`,verifyToken, postmanRouter);
router.use(`${configs.app.prefix}/record`,verifyToken, recordRouter);
// router.use(`${configs.app.prefix}/in/vms`, vmsInRouter);
