import { Router } from "express";
import { configs } from "../configs";

import { router as vmsRouter } from "./external/vms.router";
// import { router as ticketInRouter } from "./internal/ticket.router";
// import { configs } from "../configs";
// import { verifyToken } from "../middlewares";

export const router: Router = Router();
router.use(`${configs.app.prefix}/vms`, vmsRouter);
// router.use(`${configs.app.prefix}/in/ticket`, ticketInRouter);
