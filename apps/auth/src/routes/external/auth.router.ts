import { NextFunction, Request, Response, Router } from "express";
import {
    newToken,
    login,
    forgotPassword,
    setPassword,
    updatePassword,
    loginByGithub,
    createUserByGithub,
    registerGithubWithAccount,
} from "../../controllers";
import { LoginReqBody, UpdatePasswordReqBody } from "../../interfaces/request";
import { verifyToken } from "../../middlewares";
import {
    loginValidator,
    refreshTokenValidator,
    forgotPasswordValidator,
    setPasswordValidator,
    updatePasswordValidator,
    loginGithubValidator,
} from "../../validator";
import { validate } from "app";

export const router: Router = Router();

router.post(
    "/login",
    validate.body(loginValidator),
    async (req: Request, _: Response, next: NextFunction) => {
        const body = req.body as LoginReqBody;
        const result = await login(body);
        next(result);
    }
);

router.get(
    "/login-github",
    validate.query(loginGithubValidator),
    async (req: Request, _: Response, next: NextFunction) => {
        const code = req.query.code as string;
        const result = await loginByGithub({ code });
        next(result);
    }
);

router.post(
    "/forgot-password",
    forgotPasswordValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const email = req.body.email as string;
        const result = await forgotPassword({ email });
        next(result);
    }
);

router.post(
    "/sign-up-by-git",
    async (req: Request, _: Response, next: NextFunction) => {
        const code = req.query.code as string;
        const result = await createUserByGithub({ code });
        next(result);
    }
);

router.post(
    "/connect-git",
    verifyToken,
    async (req: Request, _: Response, next: NextFunction) => {
        const code = req.query.code as string;
        const userId = req.payload?.id as string;
        const result = await registerGithubWithAccount({
            code: code,
            userId: userId,
        });
        next(result);
    }
);

router.post(
    "/set-password",
    setPasswordValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const password = req.body.password as string;
        const token = req.header("reset-password-token") as string;
        const result = await setPassword({ token, password });
        next(result);
    }
);

router.post(
    "/refresh-token",
    refreshTokenValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const token = req.header("refresh-token") as string;
        const result = await newToken(token);
        next(result);
    }
);

router.post(
    "/update-password",
    verifyToken,
    updatePasswordValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const body = req.body as UpdatePasswordReqBody;
        const userId = req.payload?.id as string;
        const result = await updatePassword({
            userId,
            ...body,
        });
        next(result);
    }
);
