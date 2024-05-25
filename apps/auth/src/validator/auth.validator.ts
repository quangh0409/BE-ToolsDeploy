import { body, header, ValidationChain } from "express-validator";
import { handleValidation } from "app";
import { RequestHandler } from "express";
import Joi from "joi";
export const refreshTokenValidator = (): (
    | ValidationChain
    | RequestHandler
)[] => [
    header("refresh-token", "refresh token must not be empty")
        .exists()
        .bail()
        .notEmpty(),
    handleValidation,
];

export const setPasswordValidator = (): (
    | ValidationChain
    | RequestHandler
)[] => [
    header("reset-password-token", "reset password token must not be empty")
        .exists()
        .bail()
        .notEmpty(),
    body("password", "password must not be empty").exists().bail().notEmpty(),
    handleValidation,
];

export const updatePasswordValidator = (): (
    | ValidationChain
    | RequestHandler
)[] => [
    body("old_password", "old password must not be empty")
        .exists()
        .bail()
        .notEmpty(),
    body("new_password", "new_password must not be empty")
        .exists()
        .bail()
        .notEmpty(),
    handleValidation,
];

export const forgotPasswordValidator = (): (
    | ValidationChain
    | RequestHandler
)[] => [body("email", "email must not be empty").exists().bail().notEmpty()];

export const loginValidator = Joi.object({
    email: Joi.string().required().exist(),
    password: Joi.string().required().exist()
})

export const loginGithubValidator = Joi.object({
    code: Joi.string().required().exist(),
})


export const checkAccountValidator = (): (
    | ValidationChain
    | RequestHandler
)[] => [
    body("email", "email must not be empty").exists().bail().notEmpty(),
    handleValidation,
];
