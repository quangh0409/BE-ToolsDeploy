import { Router } from "express";
import { configs } from "../configs";
import { verifyToken } from "../middlewares";

import { router as authRouter } from "./external/auth.router";
import { router as inAccountRouter } from "./internal/account.router";
import { router as userRouter } from "./external/user.router";
import { router as inUserRouter } from "./internal/user.router";

export const router: Router = Router();
router.use(`${configs.app.prefix}/auth`, authRouter);
router.use(`${configs.app.prefix}/in/accounts`, inAccountRouter);

router.use(`${configs.app.prefix}/users`, userRouter);
router.use(`${configs.app.prefix}/in/users`, inUserRouter);
