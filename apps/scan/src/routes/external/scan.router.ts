import { NextFunction, Request, Response, Router } from "express";
import { Payload } from "app";
import { scanSyntax } from "../../controllers/scan.controller";

export const router: Router = Router();

router.post(
    "/scan-syntax",
    async (req: Request, _: Response, next: NextFunction) => {
        const content = req.body.content as string;
        const result = await scanSyntax({ content });
        next(result);
    }
);
