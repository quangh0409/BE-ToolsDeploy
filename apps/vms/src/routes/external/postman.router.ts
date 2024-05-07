import { Request, Router, Response, NextFunction } from "express";
import { runPostman } from "../../controllers/check.controller";
import { HttpStatus, Payload } from "app";

export const router: Router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    const collection = req.body.collection as string;
    const environment = req.body.environment as string;
    const service = req.body.service as string;
    const branch = req.body.branch as string;
    const env = req.body.env as string;
    const { id: userId } = req.payload as Payload;
    const result = await runPostman({
        userId,
        collection,
        environment,
        service,
        env,
        branch,
    });
    res.setHeader("Content-Type", "text/html");

    res.status(HttpStatus.OK).send(result).end();
    // next(result);
});
