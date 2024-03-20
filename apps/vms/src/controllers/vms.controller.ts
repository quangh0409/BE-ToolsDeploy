import { HttpError, HttpStatus, ResultSuccess, success } from "app";
import { resolve } from "path";
import fs from "fs";

export async function createdTicket(params: {
}): Promise<ResultSuccess> {

    return success.ok({});
}

