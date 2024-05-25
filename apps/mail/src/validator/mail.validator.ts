import { body, ValidationChain } from "express-validator";
import { handleValidation } from "app";
import { RequestHandler } from "express";

export const sendMailResetPasswordValidator = (): (
    | ValidationChain
    | RequestHandler
)[] => [
    body("email", "email must not be empty").exists().bail().notEmpty(),
    handleValidation,
];

export const sendMailValidator = (): (ValidationChain | RequestHandler)[] => [
    body("email", "email must not be empty").exists().bail().notEmpty(),
    body("subject", "subject must not be empty").exists().bail().notEmpty(),
    body("content", "content must not be empty").exists().bail().notEmpty(),
    handleValidation,
];
