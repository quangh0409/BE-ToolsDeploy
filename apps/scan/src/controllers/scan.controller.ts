import { HttpError, ResultSuccess, success, error } from "app";
import { resolve } from "path";
import fs from "fs";
import { execSync } from "child_process";
import { promisify } from "util";

const readFileAsync = promisify(fs.readFile);

export async function scanSyntax(params: {
    content: string;
}): Promise<ResultSuccess> {
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/config_file");
    const file_path_result = resolve(path, "../../", "file/hadolint.json");
    fs.writeFileSync(file_path, params.content);

    execSync(`hadolint ${file_path} --format json | tee ${file_path_result}`, {
        stdio: "inherit",
        shell: "/bin/bash",
    });

    try {
        const content: Buffer = await readFileAsync(file_path_result);
        const jsonData = JSON.parse(content.toString());
        return success.ok(jsonData);
    } catch (err) {
        throw new HttpError(error.invalidData({ value: err }));
    }
}