import { Router, Request, Response, NextFunction } from "express";
import { getVmsByIds } from "../../controllers/vms.controller";

export const router: Router = Router();

router.post("/ids", async (req: Request, _: Response, next: NextFunction) => {
    const ids = req.body.ids;
    const result = await getVmsByIds({
        ids,
    });
    next(result);
});
