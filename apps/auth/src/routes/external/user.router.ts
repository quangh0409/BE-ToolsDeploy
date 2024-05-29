import { Payload } from "app";
import { NextFunction, Request, Response, Router } from "express";
import {
    createUser,
    findUser,
    getUserById,
    updateUser,
} from "../../controllers";
import { FindReqQuery } from "../../interfaces/request";
import { verifyRole } from "../../middlewares";
import { findUserValidator } from "../../validator";

export const router: Router = Router();

router.get(
    "/",
    verifyRole("SA"),
    findUserValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const query = req.query as unknown as FindReqQuery;
        const payload = req.payload as Payload;
        const result = await findUser({
            ...query,
            userRoles: payload.roles,
        });
        next(result);
    }
);

router.post("/", async (req: Request, _: Response, next: NextFunction) => {
    const body = req.body;
    const result = await createUser({
        ...body,
    });
    next(result);
});

router.get(
    "/:userId",
    verifyRole("*"),
    async (req: Request, _: Response, next: NextFunction) => {
        const payload = req.payload as Payload;
        const { userId } = req.params;
        const result = await getUserById({
            id: userId,
            userRoles: payload.roles,
            userId: payload.id,
        });
        next(result);
    }
);

router.put(
    "/:userId",
    verifyRole("SA", "T", "S"),
    async (req: Request, _: Response, next: NextFunction) => {
        const body = req.body;
        const payload = req.payload as Payload;
        const userId = req.params.userId as string;
        const result = await updateUser({
            ...body,
            id: userId,
            userId: payload.id,
            userRoles: payload.roles,
        });
        next(result);
    }
);
