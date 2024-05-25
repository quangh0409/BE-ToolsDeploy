import { SendMailResetPassReqBody } from "../../interfaces/request/mail.body";

import { NextFunction, Request, Response, Router } from "express";
import {
    sendMailGoogleForgotPassword,
    sendMailGoogleNewAccount,
} from "../../controllers";
import { sendMailResetPasswordValidator } from "../../validator";

export const router: Router = Router();

router.post(
    "/forgot-password",
    sendMailResetPasswordValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const body = req.body as SendMailResetPassReqBody;
        const result = await sendMailGoogleForgotPassword(body);
        next(result);
    }
);

router.post(
    "/new-account",
    sendMailResetPasswordValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const body = req.body as SendMailResetPassReqBody;
        const result = await sendMailGoogleNewAccount(body);
        next(result);
    }
);

