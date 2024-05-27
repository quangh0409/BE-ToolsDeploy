import { NextFunction, Request, Response, Router } from "express";
import {
    CreateReleaseByAccessToken,
    getAGithubByCode,
    GetBranchesByAccessToken,
    GetContentsByAccessToken,
    GetInfoUserGit,
    GetInfoUserGitByAccesToken,
    GetLanguagesByAccessToken,
    GetLastCommitByAccessToken,
    GetPathFileDockerByAccessToken,
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
        const name = req.query.name as string;
        const result = await GetReposGitByAccessToken({
            userId: id,
            name: name,
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

router.post(
    "/paths-file-docker",
    async (req: Request, _: Response, next: NextFunction) => {
        const { repository, branch } = req.body;
        const { id } = req.payload as Payload;
        const result = await GetPathFileDockerByAccessToken({
            userId: id,
            repository: repository,
            branch: branch,
        });
        next(result);
    }
);

router.post(
    "/content-file",
    async (req: Request, _: Response, next: NextFunction) => {
        const { repository, sha } = req.body;
        const { id } = req.payload as Payload;
        const result = await GetContentsByAccessToken({
            userId: id,
            repository: repository,
            sha: sha,
        });
        next(result);
    }
);

router.post(
    "/last-commit",
    async (req: Request, _: Response, next: NextFunction) => {
        const { repository, branch } = req.body;
        const { id } = req.payload as Payload;
        const result = await GetLastCommitByAccessToken({
            userId: id,
            repository: repository,
            branch: branch,
        });
        next(result);
    }
);

router.post(
    "/release",
    async (req: Request, _: Response, next: NextFunction) => {
        const { repository, tag_name, target_commitish, name, body } = req.body;
        const { id } = req.payload as Payload;
        const result = await CreateReleaseByAccessToken({
            userId: id,
            repository: repository,
            tag_name,
            target_commitish,
            name,
            body,
        });
        next(result);
    }
);
