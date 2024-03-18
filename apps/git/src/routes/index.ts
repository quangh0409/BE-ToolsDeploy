import { Router } from "express";
import { configs } from "../configs";
import { verifyToken } from "../middlewares";

import { router as githubRouter } from "./external/github.router";
import { router as githubInRouter } from "./internal/github.router";

export const router: Router = Router();
router.use(`${configs.app.prefix}/git`, verifyToken, githubRouter);
router.use(`${configs.app.prefix}/in/git`, githubInRouter);
