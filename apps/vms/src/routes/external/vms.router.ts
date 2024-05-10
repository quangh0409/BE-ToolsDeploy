import { NextFunction, Request, Response, Router } from "express";
import { resolve } from "path";
import fs from "fs";
import { HttpStatus } from "app";
import {
    createVms,
    deleteVmsById,
    findVmsByHost,
    getVmsById,
    getVmsByIds,
    updateVms,
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

router.get("/", async (req: Request, _: Response, next: NextFunction) => {
    const host = req.query.host as string;
    const result = await findVmsByHost({
        host,
    });
    next(result);
});

router.get("/:vms", async (req: Request, _: Response, next: NextFunction) => {
    const vms = req.params.vms;
    const result = await getVmsById({
        vms,
    });
    next(result);
});

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

router.put("/:vms", async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.vms as string;
    const { user, pass } = req.body;
    const result = await updateVms({ id, user, pass });
    next(result);
});

router.delete(
    "/:vms/ticket/:ticket",
    async (req: Request, res: Response, next: NextFunction) => {
        const vms = req.params.vms;
        const ticket = req.params.ticket;
        const result = await deleteVmsById({ vms, ticket });
        next(result);
    }
);
