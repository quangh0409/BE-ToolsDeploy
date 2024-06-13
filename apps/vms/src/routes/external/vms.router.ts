import { NextFunction, Request, Response, Router } from "express";
import { resolve } from "path";
import {
    actionsContainerByByVmsIdAndContainerId,
    actionsImagesOfVmById,
    createVms,
    deleteVmsById,
    findContaninersOfVmById,
    findImagesOfVmById,
    findVmsByHost,
    getVmsById,
    getVmsByIds,
    installDocker,
    installHadolint,
    installTrivy,
    updateVms,
} from "../../controllers/vms.controller";
import {
    compareStandard,
    compareStandardBeforeCreate,
    createStandard,
    deleteStandard,
    getStandards,
} from "../../controllers/standard.controller";

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

router.get(
    "/:vms/install-docker",
    async (req: Request, _: Response, next: NextFunction) => {
        const vm_id = req.params.vms;
        const user_id = req.payload?.id as string;
        const result = await installDocker({
            vm_id,
            user_id,
        });
        next(result);
    }
);
router.get(
    "/:vms/install-trivy",
    async (req: Request, _: Response, next: NextFunction) => {
        const vm_id = req.params.vms;
        const user_id = req.payload?.id as string;
        const result = await installTrivy({
            vm_id,
            user_id,
        });
        next(result);
    }
);
router.get(
    "/:vms/install-hadolint",
    async (req: Request, _: Response, next: NextFunction) => {
        const vm_id = req.params.vms;
        const user_id = req.payload?.id as string;
        const result = await installHadolint({
            vm_id,
            user_id,
        });
        next(result);
    }
);

router.get(
    "/:vms/contaniners",
    async (req: Request, _: Response, next: NextFunction) => {
        const vms = req.params.vms;
        const name = req.query.name as string;
        const result = await findContaninersOfVmById({
            vms,
            name,
        });
        next(result);
    }
);

router.get(
    "/:vms/contaniners/:container",
    async (req: Request, _: Response, next: NextFunction) => {
        const vms = req.params.vms;
        const container = req.params.container;
        const action = req.query.action as string;
        const result = await actionsContainerByByVmsIdAndContainerId({
            vms,
            containerId: container,
            action: action,
        });
        next(result);
    }
);

router.delete(
    "/:vms/images/:image",
    async (req: Request, _: Response, next: NextFunction) => {
        const vms = req.params.vms;
        const image = req.params.image;
        const result = await actionsImagesOfVmById({
            vms,
            imnageId: image,
        });
        next(result);
    }
);

router.get(
    "/:vms/images",
    async (req: Request, _: Response, next: NextFunction) => {
        const vms = req.params.vms;
        const name = req.query.name as string;
        const result = await findImagesOfVmById({
            vms,
            name,
        });
        next(result);
    }
);

router.get("/:vms", async (req: Request, _: Response, next: NextFunction) => {
    const vms = req.params.vms;
    const result = await getVmsById({
        vms,
    });
    next(result);
});

router.post("/ids", async (req: Request, _: Response, next: NextFunction) => {
    const ids = req.body.ids;
    const host = req.query.host as string;
    const result = await getVmsByIds({
        ids,
        host,
    });
    next(result);
});

router.post(
    "/standards/compare",
    async (req: Request, _: Response, next: NextFunction) => {
        const { standard, vms } = req.body;
        const result = await compareStandard({
            standard,
            vms,
        });
        next(result);
    }
);

router.post(
    "/standards/delete",
    async (req: Request, _: Response, next: NextFunction) => {
        const { ticket, standard } = req.body;
        const result = await deleteStandard({
            ticket,
            standard,
        });
        next(result);
    }
);

router.post(
    "/standards/compare-before-create-vms",
    async (req: Request, _: Response, next: NextFunction) => {
        const { standard, host, user, pass, port } = req.body;
        const result = await compareStandardBeforeCreate({
            standard,
            host,
            user,
            pass,
            port: port,
        });
        next(result);
    }
);

router.post(
    "/standards/get-all",
    async (req: Request, _: Response, next: NextFunction) => {
        const { standards } = req.body;
        const result = await getStandards({
            standards,
        });
        next(result);
    }
);

router.post(
    "/standards/",
    async (req: Request, _: Response, next: NextFunction) => {
        const { name, ram, cpu, core, os, architecture } = req.body;
        const userId = req.payload?.id as string;
        const result = await createStandard({
            userId,
            name,
            ram,
            cpu,
            core,
            os,
            architecture,
        });
        next(result);
    }
);

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    const { host, user, pass, standard, port } = req.body;
    const result = await createVms({
        host,
        user,
        pass,
        standard,
        port: port,
    });
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
