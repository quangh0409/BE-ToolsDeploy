import { Router } from "express";
import { configs } from "../configs";

import { router as vmsRouter } from "./external/vms.router";
import { router as vmsInRouter } from "./internal/vms.router";
import { verifyToken } from "../middlewares";

export const router: Router = Router();
router.use(`${configs.app.prefix}/vms`,verifyToken, vmsRouter);
// router.use(`${configs.app.prefix}/in/vms`, vmsInRouter);
