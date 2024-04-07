import { Request, Router, Response, NextFunction } from "express";
import { IServiceBody } from "../../interfaces/request/service.body";
import { GetAllService, createService } from "../../controllers/service.controller";

export const router: Router = Router();

router.post("/", async (req: Request, _: Response, next: NextFunction) => {
    const body = req.body.service as IServiceBody;
    const result = await createService(body);
    next(result);
});

router.get("/vm/:vm", async (req: Request, _: Response, next: NextFunction) => {
    const vm = req.params.vm as string;
    const result = await GetAllService({
        vm,
    });
    next(result);
});
