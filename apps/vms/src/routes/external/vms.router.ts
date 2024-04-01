import { NextFunction, Request, Response, Router } from "express";
import { resolve } from "path";
import fs from "fs";
import { HttpStatus } from "app";
import {
    createVms,
    getVmsByIds,
} from "../../controllers/vms.controller";

export const router: Router = Router();

router.get(
    "/download/key/pub",
    async (req: Request, res: Response, next: NextFunction) => {
        const path = __dirname;
        const file_name = resolve(path, "../../../", "file/id_rsa.pub");
        res.download(file_name, "id_rsa.pub");
    }
);

router.post("/ids", async (req: Request, _: Response, next: NextFunction) => {
    const ids = req.body.ids;
    const result = await getVmsByIds({
        ids,
    });
    next(result);
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    const { host, user, pass } = req.body;
    const result = await createVms({ host, user, pass });
    next(result);
});


