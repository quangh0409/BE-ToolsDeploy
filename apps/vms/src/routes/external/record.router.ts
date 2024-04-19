import { NextFunction, Request, Response, Router } from "express";
import { Payload } from "app";
import {
    createRecord,
    updateRecord,
} from "../../controllers/record.controller";

export const router: Router = Router();

router.post("/", async (req: Request, _: Response, next: NextFunction) => {
    const result = await createRecord(req.body);
    next(result);
});

router.put(
    "/:record",
    async (req: Request, _: Response, next: NextFunction) => {
        const result = await updateRecord(req.body);
        next(result);
    }
);
