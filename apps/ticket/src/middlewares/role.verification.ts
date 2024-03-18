import { error } from "app";
import { NextFunction, Request, RequestHandler, Response } from "express";

export function verifySystemAdmin(
    req: Request,
    _: Response,
    next: NextFunction
): void {
    const errorResult = error.actionNotAllowed();
    if (!req.payload) {
        return next(errorResult);
    }

    const { roles } = req.payload;
    if (roles.includes("SA")) {
        return next();
    } else {
        return next(errorResult);
    }
}

export function verifyRole(...roles: string[]): RequestHandler {
    if (roles.includes("*")) {
        roles.push("SA", "T", "S");
    }

    // if (roles.includes("L*")) {
    //     roles.push("L1", "L2");
    // }

    return (req: Request, _: Response, next: NextFunction) => {
        const errorResult = error.actionNotAllowed();
        if (!req.payload) {
            return next(errorResult);
        }

        const { roles: userRoles } = req.payload;
        const isRoleOke = userRoles.some((r) => {
            return roles.includes(r);
        });
        if (isRoleOke) {
            return next();
        }
        return next(errorResult);
    };
}
