import { ResultSuccess, success } from "app";
import newman from "newman";
import { resolve } from "path";
import fs from "fs";
import { promisify } from "util";
const readFileAsync = promisify(fs.readFile);
const util = require("util");
const newPostman = util.promisify(newman.run);

export async function runPostman(params: {
    userId: string;
    collection: string;
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

    try {
        await newPostman({
            collection: JSON.parse(collection),
            reporters: ["htmlextra"],
            reporter: {
                htmlextra: { export: file_path }, // Không xuất ra tệp
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
