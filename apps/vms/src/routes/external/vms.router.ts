import { NextFunction, Request, Response, Router } from "express";
import { resolve } from "path";
import fs from "fs";
import { HttpStatus } from "app";
import {
    sshCheckConnectDev,
    sshInstallDocker,
    sshInstallDockerDev,
} from "../../controllers/vms.controller";

export const router: Router = Router();

router.get(
    "/ssh/win",
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await sshInstallDocker();
        next(result);
    }
);
router.get(
    "/ssh/dev",
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await sshCheckConnectDev();
        next(result);
    }
);

router.get(
    "/ssh/dev/installDocker",
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await sshInstallDockerDev();
        next(result);
    }
);

router.get(
    "/download/key/pub",
    async (req: Request, res: Response, next: NextFunction) => {
        const path = __dirname;
        const file_name = resolve(path, "../../../", "file/id_rsa.pub");
        res.download(file_name, "id_rsa.pub");
    }
);
