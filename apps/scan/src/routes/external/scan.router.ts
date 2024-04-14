import { NextFunction, Request, Response, Router } from "express";
import { Payload } from "app";
import { scanImages, scanSyntax } from "../../controllers/scan.controller";

export const router: Router = Router();

router.post(
    "/scan-syntax",
    async (req: Request, _: Response, next: NextFunction) => {
        const content = req.body.content as string;
        const result = await scanSyntax({ content });
        next(result);
    }
);

router.post(
    "/scan-image",
    async (req: Request, _: Response, next: NextFunction) => {
        const image = req.body.image as string;
        const result = await scanImages({ image });
        next(result);
    }
);
