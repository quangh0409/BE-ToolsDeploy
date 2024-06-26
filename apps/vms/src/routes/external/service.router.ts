import { Request, Router, Response, NextFunction } from "express";
import { IServiceBody } from "../../interfaces/request/service.body";
import {
    getAllService,
    createService,
    getServiceById,
    deleteService,
    getImagesOfServiceById,
    scanImageOfService,
    findServiceInVmsByName,
    updateService,
} from "../../controllers/service.controller";
import { IRecordReqBodyCreate } from "../../interfaces/request/record.body";
import { createRecord } from "../../controllers/record.controller";

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
    const result = await getAllService({
        vm,
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

router.put(
    "/:service",
    async (req: Request, _: Response, next: NextFunction) => {
        const service = req.params.service as string;
        const body = req.body.service as IServiceBody;
        const result = await updateService({ ...body, id: service });
        next(result);
    }
);
