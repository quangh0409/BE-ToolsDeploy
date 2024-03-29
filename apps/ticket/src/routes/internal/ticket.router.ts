import { NextFunction, Request, Response, Router } from "express";
import {
    checkTicketExitsByGithubId,
    checkTicketExitsByUserId,
    createdTicket,
    findTicketByGithubId,
    findTicketByUserId,
} from "../../controllers/ticket.controller";

export const router: Router = Router();

router.get("/by-user-id", async (req: Request, _: Response, next: NextFunction) => {
    const user_id = req.query.user_id as string;
    const result = await findTicketByUserId({ user_id: user_id });
    next(result);
});

router.get("/by-github-id", async (req: Request, _: Response, next: NextFunction) => {
    const github_id = req.query.github_id as string;
    const result = await findTicketByGithubId({ github_id: github_id });
    next(result);
});

router.get(
    "/check-ticket-by-user/:user_id",
    async (req: Request, _: Response, next: NextFunction) => {
        const user_id = req.params.user_id as string;
        const result = await checkTicketExitsByUserId({ user_id: user_id });
        next(result);
    }
);

router.get(
    "/check-ticket-by-github/:github_id",
    async (req: Request, _: Response, next: NextFunction) => {
        const github_id = req.params.github_id as string;
        const result = await checkTicketExitsByGithubId({
            github_id: github_id,
        });
        next(result);
    }
);

router.post("/", async (req: Request, _: Response, next: NextFunction) => {
    const body = req.body;
    console.log("🚀 ~ router.post ~ body:", body)
    const result = await createdTicket({ ...body });
    next(result);
});
