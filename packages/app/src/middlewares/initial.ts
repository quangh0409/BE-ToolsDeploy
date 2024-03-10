import { NextFunction, Request, Response } from "express";
import logger from "logger";
import { v1 } from "uuid";
import { mask } from "../mask";
import { setCorrelationId } from "../hook";

export const requestInitialization = (
    req: Request,
    _: Response,
    next: NextFunction
): void => {
    const timeNow = new Date();
    req.request_id = v1();
    const body = JSON.parse(JSON.stringify(req.body));
    mask(body, ["password", "accessToken", "refreshToken"]);
    const client = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const correlationId = req.headers["x-correlation-id"] || v1();
    req.correlation_id = String(correlationId);
    setCorrelationId(String(correlationId));
    const data = {
        request_id: req.request_id,
        correlation_id: correlationId,
        request_time: timeNow,
        requester: client,
        method: req.method,
        url: req.url,
        body,
    };

    logger.info(JSON.stringify(data), { tags: ["request"] });
    next();
};
