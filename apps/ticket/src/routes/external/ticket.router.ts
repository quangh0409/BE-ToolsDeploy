import { NextFunction, Request, Response, Router } from "express";
import {
    checkTicketExitsByUserId,
    findTicketByUserId,
    findTicketDetailByUserId,
} from "../../controllers/ticket.controller";
import { verifyRole } from "../../middlewares";
import { Payload } from "app";

export const router: Router = Router();

router.get(
    "/",
    verifyRole("U"),
    async (req: Request, _: Response, next: NextFunction) => {
        const { id: user_id } = req.payload as Payload;
        const result = await findTicketDetailByUserId({ user_id: user_id });
        next(result);
    }
);

router.get(
    "/check-ticket-exits/:user_id",
    async (req: Request, _: Response, next: NextFunction) => {
        const user_id = req.params.user_id as string;
        const result = await checkTicketExitsByUserId({ user_id: user_id });
        next(result);
    }
);


