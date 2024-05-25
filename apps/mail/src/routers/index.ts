import { Router } from "express";
import { configs } from "../configs";
import { router as mailRouter } from "./external/mail.router";
import { router as InMailRouter } from "./internal/mail.router";

export const router: Router = Router();

router.use(`${configs.app.prefix}/mail`, mailRouter);
router.use(`${configs.app.prefix}/in/mail`, InMailRouter);
