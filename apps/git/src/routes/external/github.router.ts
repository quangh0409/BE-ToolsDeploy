import { NextFunction, Request, Response, Router } from "express";
import {
    getAGithubByCode,
    GetBranchesByAccessToken,
    GetInfoUserGit,
    GetInfoUserGitByAccesToken,
    GetLanguagesByAccessToken,
    GetReposGitByAccessToken,
} from "../../controllers/github.controller";
import { Payload } from "app";

export const router: Router = Router();

router.post(
    "/user-git-token",
    async (req: Request, _: Response, next: NextFunction) => {
        const { id } = req.payload as Payload;
        const result = await GetInfoUserGit({
            userId: id,
        });
        next(result);
    }
);

router.post(
    "/repos-git-token",
    async (req: Request, _: Response, next: NextFunction) => {
        const { id } = req.payload as Payload;
        const result = await GetReposGitByAccessToken({
            userId: id,
        });
        next(result);
    }
);

router.post(
    "/branches",
    async (req: Request, _: Response, next: NextFunction) => {
        const { repository } = req.body;
        const { id } = req.payload as Payload;
        const result = await GetBranchesByAccessToken({
            userId: id,
            repository: repository,
        });
        next(result);
    }
);

router.post(
    "/languages",
    async (req: Request, _: Response, next: NextFunction) => {
        const { repository } = req.body;
        const { id } = req.payload as Payload;
        const result = await GetLanguagesByAccessToken({
            userId: id,
            repository: repository,
        });
        next(result);
    }
);
