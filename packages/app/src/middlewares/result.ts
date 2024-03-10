import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../constant/status";
import errorList, { ErrorData, HttpError } from "../error";
import { error, Result, ResultError, ResultSuccess } from "../result";
import logger from "logger";
import { mask } from "../mask";
import { Middleware } from "./common";
import { Any } from "utils";

export default (env?: string): Middleware => {
    const func = (
        result: Result | Error,
        request: Request,
        response: Response,
        _: NextFunction
    ): void => {
        let data: ResultError | ResultSuccess;
        if (result instanceof SyntaxError) {
            data = error.syntax(result);
        } else if (result instanceof HttpError) {
            data = result.error;
        } else if (result instanceof Error) {
            logger.error("%O", result);
            data = error.exception(result);
        } else {
            data = result;
        }
        handleResult(data, request, response, env);
    };
    return func as NextFunction;
};

function handleResult(
    data: Result,
    request: Request,
    response: Response,
    env?: string
): void {
    const environment = env || "dev";
    const statusCode = data.status ?? HttpStatus.BAD_REQUEST;
    let responseData: Any;

    if (data.status > 300) {
        let resultError = data as ResultError;
        if (
            environment === "pro" &&
            resultError.status === HttpStatus.METHOD_NOT_ALLOWED
        ) {
            resultError = error.urlNotFound(request.path);
        }
        let { lang } = request.headers;
        lang = lang ?? "vi";
        const errorCode = resultError.code ?? "UNKNOWN_ERROR";
        const err = errorList.find(
            (value: ErrorData) => value.errorCode === errorCode
        );
        let description: string | undefined = undefined;
        if (resultError.description?.vi && lang === "vi") {
            description = resultError.description.vi;
        }
        if (resultError.description?.en && lang === "en") {
            description = resultError.description.en;
        }
        if (!description && err && err.description) {
            if (err.description.vi && lang === "vi") {
                description = err.description.vi;
            }
            if (err.description.en && lang === "en") {
                description = err.description.en;
            }
        }
        responseData = {
            code: errorCode,
            description: description,
            details: resultError.details,
        };
        if (environment === "dev") {
            responseData["errors"] = resultError.errors;
        }
    } else {
        const resultSuccess = data as ResultSuccess;
        responseData = resultSuccess.data;
    }
    if (responseData !== null && responseData !== undefined) {
        if (typeof responseData.toJSON === "function") {
            responseData = responseData.toJSON();
        }
    }
    const maskedResponseData = { ...responseData };
    mask(maskedResponseData, ["password", "accessToken", "refreshToken"]);
    const correlationId = request.correlation_id;
    const request_id = request.request_id;
    logResponse(request_id, statusCode, maskedResponseData, correlationId);
    response.status(statusCode).json(responseData);
}

const logResponse = (
    request_id: string,
    status_code: HttpStatus,
    body: Any,
    correlation_id?: string
): void => {
    const response_time = new Date();
    const data = {
        request_id,
        correlation_id,
        response_time,
        status_code,
        body,
    };
    logger.info(JSON.stringify(data), { tags: ["response"] });
};

export const notFoundMiddlewares = (
    req: Request,
    _: Response,
    next: NextFunction
): void => {
    const requestedUrl = `${req.protocol}://${req.get("Host")}${req.url}`;
    const error = {
        status: HttpStatus.NOT_FOUND,
        code: "URL_NOT_FOUND",
        errors: [
            {
                method: req.method,
                url: requestedUrl,
            },
        ],
    };
    if (!req.route) {
        next(error);
    }
    next();
};
