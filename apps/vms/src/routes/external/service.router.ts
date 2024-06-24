import { Request, Router, Response, NextFunction } from "express";
import {
    IEnvironment,
    IServiceBody,
} from "../../interfaces/request/service.body";
import {
    getAllService,
    createService,
    getServiceById,
    deleteService,
    getImagesOfServiceById,
    scanImageOfService,
    findServiceInVmsByName,
    updateService,
    getAllInfoOfRepos,
    updateEnvService,
    addEnvService,
    deleteEnvService,
    deleteServiceInAllVm,
} from "../../controllers/service.controller";
import { IRecordReqBodyCreate } from "../../interfaces/request/record.body";
import { createRecord } from "../../controllers/record.controller";
import { Payload } from "app";

export const router: Router = Router();

router.post("/", async (req: Request, _: Response, next: NextFunction) => {
    const body = req.body.service as IServiceBody;
    const result = await createService(body);
    next(result);
});

router.post(
    "/images",
    async (req: Request, _: Response, next: NextFunction) => {
        const { service, env } = req.body;
        const result = await getImagesOfServiceById({
            service,
            env,
        });
        next(result);
    }
);

router.post(
    "/:service/env/:env/record",
    async (req: Request, _: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const env = req.params.env as string;
        const body = req.body as IRecordReqBodyCreate;
        const result = await createRecord({
            service,
            env,
            ...body,
        });
        next(result);
    }
);

router.get(
    "/infos-repo",
    async (req: Request, _: Response, next: NextFunction) => {
        const name = req.query.name as string;
        const { id: userId } = req.payload as Payload;
        const result = await getAllInfoOfRepos({
            userId,
            name,
        });
        next(result);
    }
);

router.get("/images", async (req: Request, _: Response, next: NextFunction) => {
    const service = req.query.service as string;
    const env = req.query.env as string;
    const image = req.query.image as string;
    const result = await scanImageOfService({
        service,
        env,
        image,
    });
    next(result);
});

router.get("/vm/:vm", async (req: Request, _: Response, next: NextFunction) => {
    const vm = req.params.vm as string;
    const name = req.query.name as string;
    const result = await getAllService({
        vm,
        name
    });
    next(result);
});

router.get("/", async (req: Request, _: Response, next: NextFunction) => {
    const service = req.query.service as string;
    const vm = req.query.vm as string;
    const result = await findServiceInVmsByName({
        vm,
        service,
    });
    next(result);
});

router.get(
    "/:service",
    async (req: Request, _: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const result = await getServiceById({
            id: service,
        });
        next(result);
    }
);

router.delete(
    "/:service/vm/:vm",
    async (req: Request, _: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const vm = req.params.vm as string;
        const result = await deleteService({
            id: service,
            vm: vm,
        });
        next(result);
    }
);

router.delete(
    "/:service/environment",
    async (req: Request, _: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const name = req.query.name as string;
        const result = await deleteEnvService({
            id: service,
            name: name,
        });
        next(result);
    }
);

router.delete(
    "/:service",
    async (req: Request, _: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const result = await deleteServiceInAllVm({
            id: service,
        });
        next(result);
    }
);

router.put(
    "/:service/environment",
    async (req: Request, _: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const name = req.query.name as string;
        const body = req.body as IEnvironment;
        const result = await updateEnvService({
            ...body,
            name: name,
            id: service,
        });
        next(result);
    }
);

router.put(
    "/:service/add-environment",
    async (req: Request, _: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const body = req.body.environment as IEnvironment;
        console.log("🚀 ~ body:", body);
        const result = await addEnvService({
            ...body,
            id: service,
        });
        next(result);
    }
);

router.put(
    "/:service",
    async (req: Request, _: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const body = req.body.service as IServiceBody;
        const result = await updateService({ ...body, id: service });
        next(result);
    }
);
