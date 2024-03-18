import { NextFunction, Request, Response, Router } from "express";
import {
    getAGithubByCode,
    GetBranchesByAccessToken,
    GetInfoUserGitByAccesToken,
    GetLanguagesByAccessToken,
    GetReposGitByAccessToken,
} from "../../controllers/github.controller";

export const router: Router = Router();

router.post(
    "/user-git-token",
    async (req: Request, _: Response, next: NextFunction) => {
        const { token } = req.body;
        const result = await GetInfoUserGitByAccesToken({
            access_token: token,
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
