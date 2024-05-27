import { NextFunction, Request, Response, Router } from "express";
import {
    checkTicketExitsByUserId,
    findTicketDetailByUserId,
    updateTicket,
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

router.put("/", async (req: Request, _: Response, next: NextFunction) => {
    const { id } = req.payload as Payload;
    const { vms_ids, standard_ids } = req.body;

    const result = await updateTicket({
        user_id: id,
        vms_ids: vms_ids,
        standard_ids: standard_ids
    });
    next(result);
});
