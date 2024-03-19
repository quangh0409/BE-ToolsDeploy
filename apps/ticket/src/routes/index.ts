import { Router } from "express";

import { router as ticketRouter } from "./external/ticket.router";
import { router as ticketInRouter } from "./internal/ticket.router";
import { configs } from "../configs";
import { verifyToken } from "../middlewares";

export const router: Router = Router();
router.use(`${configs.app.prefix}/ticket`, verifyToken, ticketRouter);
router.use(`${configs.app.prefix}/in/ticket`, ticketInRouter);
