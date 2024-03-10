import { NextFunction, Request, Response, Router } from "express";
import {
    getUserByIds,
    _getUserById,
    findUser,
    getUserByEmail,
    updateUser,
    getAllUserByPosition,
} from "../../controllers";
import { findUserByIdsValidator, findUserValidator } from "../../validator";
import {
    FindUserByEmailReqQuery,
    FindReqQuery,
} from "../../interfaces/request";

export const router: Router = Router();

router.get(
    "/",
    findUserValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const query = req.query as unknown as FindReqQuery;
        const result = await findUser({
            ...query,
            userRoles: [],
        });
        next(result);
    }
);

router.get(
    "/position/:position",
    findUserValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const position = req.params.position as string;
        const semester = req.query.semester as string;
        const result = await getAllUserByPosition({
            position,
            type: true,
            semester,
        });
        next(result);
    }
);

router.post(
    "/get-by-ids",
    findUserByIdsValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const { ids } = req.body;
        const result = await getUserByIds(ids);
        next(result);
    }
);

router.get(
    "/get-by-email",
    async (req: Request, _: Response, next: NextFunction) => {
        const { email } = req.query as unknown as FindUserByEmailReqQuery;
        const result = await getUserByEmail({ email });
        next(result);
    }
);

router.get(
    "/:userId",
    async (req: Request, _: Response, next: NextFunction) => {
        const userId = req.params.userId as string;
        const result = await _getUserById(userId);
        next(result);
    }
);

router.put(
    "/update/:userId",
    async (req: Request, _: Response, next: NextFunction) => {
        const body = req.body;
        const roles: string[] = req.body.userRoles;
        const userId: string = req.body.userId;
        const id = req.params.userId as string;
        const result = await updateUser({
            ...body,
            id: id,
            userId: userId,
            userRoles: roles,
        });
        next(result);
    }
);
