import { handleValidation } from "app";
import { RequestHandler } from "express";
import { body, ValidationChain } from "express-validator";
import { notString } from "utils";

export const updateTenantActivationValidator = (): (
    | ValidationChain
    | RequestHandler
)[] => [
    body("status", "status must boolean").exists().bail().isBoolean(),
    body("tenants", "codes must be array of string")
        .notEmpty()
        .bail()
        .isArray()
        .bail()
        .custom((i) => !i.some(notString)),
    handleValidation,
];
