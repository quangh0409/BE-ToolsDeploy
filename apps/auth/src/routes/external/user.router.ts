import { error, HttpError, Payload } from "app";
import { NextFunction, Request, Response, Router } from "express";
import {
    createUser,
    findUser,
    getAllUserByPosition,
    GetBranchesByAccessToken,
    GetInfoUserGitByAccesToken,
    GetLanguagesByAccessToken,
    GetReposGitByAccessToken,
    getUserById,
    importUser,
    updateUser,
} from "../../controllers";
import { ImportUserReqBody } from "../../interfaces/request";
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

router.post(
    "/user-git-token",
    async (req: Request, _: Response, next: NextFunction) => {
        const { token } = req.body;
        const result = await GetInfoUserGitByAccesToken({
            access_token_git: token,
        });
        next(result);
    }
);

router.post(
    "/repos-git-token",
    async (req: Request, _: Response, next: NextFunction) => {
        const { token, user } = req.body;
        const result = await GetReposGitByAccessToken({
            access_token_git: token,
            user: user,
        });
        next(result);
    }
);

router.post(
    "/branches",
    async (req: Request, _: Response, next: NextFunction) => {
        const { token, user, repository } = req.body;
        const result = await GetBranchesByAccessToken({
            access_token_git: token,
            user: user,
            repository: repository,
        });
        next(result);
    }
);

router.post(
    "/languages",
    async (req: Request, _: Response, next: NextFunction) => {
        const { token, user, repository } = req.body;
        const result = await GetLanguagesByAccessToken({
            access_token_git: token,
            user: user,
            repository: repository,
        });
        next(result);
    }
);

router.post(
    "/",
    verifyRole("SA"),
    async (req: Request, _: Response, next: NextFunction) => {
        const body = req.body;
        const payload = req.payload as Payload;
        const result = await createUser({
            ...body,
            userId: payload.id,
            userRoles: payload.roles,
        });
        next(result);
    }
);

router.post(
    "/import",
    verifyRole("SA"),
    // importUserValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        if (!Array.isArray(req.body)) {
            throw new HttpError(
                error.invalidData({
                    location: "body",
                    value: req.body,
                    message: "request body must be an array",
                })
            );
        }

        const body: ImportUserReqBody = req.body;
        const payload = req.payload as Payload;

        const result = await importUser({
            data: body,
            userId: payload.id,
            userRoles: payload.roles,
        });
        next(result);
    }
);

// router.get(
//     "/import-template",
//     verifyRole("SA"),
//     async (_: Request, __: Response, next: NextFunction) => {
//         const result = await getTemplateUrl();
//         next(result);
//     }
// );
router.get(
    "/position/",
    findUserValidator(),
    async (req: Request, _: Response, next: NextFunction) => {
        const position = req.query.position as string;
        const semester = req.query.semester as string;
        const result = await getAllUserByPosition({
            position,
            semester,
        });
        next(result);
    }
);

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
