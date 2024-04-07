import { Request, Router, Response, NextFunction } from "express";
import { IServiceBody } from "../../interfaces/request/service.body";
import { createService } from "../../controllers/service.controller";

export const router: Router = Router();

router.post("/", async (req: Request, _: Response, next: NextFunction) => {
    const body = req.body.service as IServiceBody;
    const result = await createService(body);
    next(result);
});
