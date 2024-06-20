import { NextFunction, Request, Response, Router } from "express";
import {
    GetBranchesByAccessToken,
    GetInfoUserGitByAccesToken,
    GetLastCommitByAccessToken,
    GetReposGitByAccessToken,
    createGitHub,
    getAGithubByCode,
    getGitHubById,
    updateGitHub,
} from "../../controllers/github.controller";

export const router: Router = Router();

router.put("/", async (req: Request, _: Response, next: NextFunction) => {
    const body = req.body;
    const result = await updateGitHub({
        ...body,
    });
    next(result);
});

router.get(
    "/handle-code",
    async (req: Request, _: Response, next: NextFunction) => {
        const code = req.query.code as string;
        const result = await getAGithubByCode({ code: code });
        next(result);
    }
);

router.post("/repos", async (req: Request, _: Response, next: NextFunction) => {
    const { userId, name } = req.body;

    const result = await GetReposGitByAccessToken({ userId, name });

    next(result);
});

router.post(
    "/branchs",
    async (req: Request, _: Response, next: NextFunction) => {
        const { userId, repository } = req.body;

        const result = await GetBranchesByAccessToken({ userId, repository });

        next(result);
    }
);

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
    "/last-commit",
    async (req: Request, _: Response, next: NextFunction) => {
        const { repository, branch, userId } = req.body;
        const result = await GetLastCommitByAccessToken({
            userId: userId,
            repository: repository,
            branch: branch,
        });
        next(result);
    }
);

router.post("/", async (req: Request, _: Response, next: NextFunction) => {
    const body = req.body;
    const result = await createGitHub({
        ...body,
    });
    next(result);
});

router.get(
    "/:git_id",
    async (req: Request, _: Response, next: NextFunction) => {
        const git_id = req.params.git_id as string;
        const result = await getGitHubById({ git_id: git_id });
        next(result);
    }
);
