import { Request, Router, Response, NextFunction } from "express";
import { runPostman } from "../../controllers/check.controller";
import { HttpStatus, Payload } from "app";

export const router: Router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    const collection = req.body.collection as string;
    const environment = req.body.environment as string;
    const { id: userId } = req.payload as Payload;
    const result = await runPostman({ userId, collection, environment });
    res.setHeader("Content-Type", "text/html");

    res.status(HttpStatus.OK).send(result).end();
    // next(result);
});
