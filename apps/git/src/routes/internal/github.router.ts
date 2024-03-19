import { NextFunction, Request, Response, Router } from "express";
import {
    GetInfoUserGitByAccesToken,
    createGitHub,
    getAGithubByCode,
    getGitHubById,
    updateGitHub,
} from "../../controllers/github.controller";

export const router: Router = Router();

router.post("/", async (req: Request, _: Response, next: NextFunction) => {
    const body = req.body;
    const result = await createGitHub({
        ...body,
    });
    next(result);
});

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

router.get(
    "/:git_id",
    async (req: Request, _: Response, next: NextFunction) => {
        const git_id = req.params.git_id as string;
        const result = await getGitHubById({ git_id: git_id });
        next(result);
    }
);
