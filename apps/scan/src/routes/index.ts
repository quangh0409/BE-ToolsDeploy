import { Router } from "express";
import { configs } from "../configs";
import { verifyToken } from "../middlewares";

import { router as scanRouter } from "./external/scan.router";
import { router as scanInRouter } from "./internal/scan.router";

export const router: Router = Router();
router.use(`${configs.app.prefix}/scan`, verifyToken, scanRouter);
// router.use(`${configs.app.prefix}/in/scan`, scanInRouter);
