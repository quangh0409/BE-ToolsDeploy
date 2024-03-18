import { NextFunction, Request, Response, Router } from "express";
import { checkTicketExitsByUserId, findTicketByUserId } from "../../controllers/ticket.controller";

export const router: Router = Router();

router.get(
    "/check-ticket-exits/:user_id",
    async (req: Request, _: Response, next: NextFunction) => {
        const user_id = req.params.user_id as string;
        const result = await checkTicketExitsByUserId({ user_id: user_id });
        next(result);
    }
);

router.get(
    "/",
    async (req: Request, _: Response, next: NextFunction) => {
        const user_id = req.query.user_id as string;
        const result = await findTicketByUserId({ user_id: user_id });
        next(result);
    }
);