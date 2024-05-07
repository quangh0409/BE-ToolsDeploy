import { ResultSuccess, success } from "app";
import newman from "newman";
import { resolve } from "path";
import fs from "fs";
import { promisify } from "util";
import { title } from "process";
const readFileAsync = promisify(fs.readFile);
const util = require("util");
const newPostman = util.promisify(newman.run);

export async function runPostman(params: {
    userId: string;
    collection: string;
    environment: string;
    service: string;
    env: string;
    branch: string;
}): Promise<Buffer | undefined> {
    const path = __dirname;
    const file_path = resolve(
        path,
        "../../",
        `file/report_FE_${params.userId}.html`
    );
    const collection = Buffer.from(params.collection, "base64").toString(
        "utf-8"
    );
    const environment = Buffer.from(params.environment, "base64").toString(
        "utf-8"
    );

    try {
        await newPostman({
            collection: JSON.parse(collection),
            environment: JSON.parse(environment),

            reporters: ["htmlextra"],
            reporter: {
                htmlextra: { export: file_path }, // Không xuất ra tệp
                title: `Report test service-${params.service} environment-${params.env} branch-${params.branch}`,
            },
        });

        let htmlContent = fs.readFileSync(file_path);
        fs.unlinkSync(file_path);
        return htmlContent;
    } catch (err) {
        console.error(err);
        return;
    }
}
