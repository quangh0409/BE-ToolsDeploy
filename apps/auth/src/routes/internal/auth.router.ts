import { NextFunction, Request, Response, Router } from "express";
import { LoginReqBody } from "../../interfaces/request";
import { login } from "../../controllers";

export const router: Router = Router();

router.post(
    "/login",
    async (req: Request, _: Response, next: NextFunction) => {
        const body = req.body as LoginReqBody;
        const result = await login(body);
        next(result);
    }
);