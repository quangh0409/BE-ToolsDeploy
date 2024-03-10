import { NextFunction, Request, Response, Router } from "express";
import { getIdByEmail, getRoleById } from "../../controllers";

export const router: Router = Router();

router.get(
    "/get-roles-by-id/:id",
    async (req: Request, _: Response, next: NextFunction) => {
        const id = req.params.id;
        const result = await getRoleById(id);
        next(result);
    }
);

router.get(
    "/get-id-by-email/:email",
    async (req: Request, _: Response, next: NextFunction) => {
        const email = req.params.email;
        const result = await getIdByEmail(email);
        next(result);
    }
);
