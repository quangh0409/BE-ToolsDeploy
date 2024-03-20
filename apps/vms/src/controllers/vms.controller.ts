import { HttpError, HttpStatus, ResultSuccess, success } from "app";
import { resolve } from "path";
import fs from "fs";

export async function createdTicket(params: {
}): Promise<ResultSuccess> {
 
    // const path = __dirname;
    // const file_name = resolve(path, "../../", "models/id_rsa");
    // // const fileStream: fs.ReadStream = fs.createReadStream(file_name);
    
    return success.ok({});
}

