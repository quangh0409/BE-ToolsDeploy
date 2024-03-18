import { Router } from "express";

import { router as ticketRouter } from "./external/ticket.router";
import { router as ticketInRouter } from "./internal/ticket.router";
import { configs } from "../configs";

export const router: Router = Router();
router.use(`${configs.app.prefix}/ticket`, ticketRouter);
router.use(`${configs.app.prefix}/in/ticket`, ticketInRouter);
