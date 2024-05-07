import { ResultSuccess, success } from "app";
import newman from "newman";
import { resolve } from "path";
import fs from "fs";
import { promisify } from "util";
const readFileAsync = promisify(fs.readFile);

export async function runPostman(params: {
    userId: string;
    collection: string;
}): Promise<Buffer> {
    const path = __dirname;
    const file_path = resolve(
        path,
        "../../",
        `file/report_FE_${params.userId}.html`
    );
    const collection = Buffer.from(params.collection, "base64").toString(
        "utf-8"
    );

    // Chạy Newman và đọc tệp cùng lúc
    await new Promise((resolve, reject) => {
        newman.run(
            {
                collection: JSON.parse(collection),
                reporters: ["htmlextra"],
                reporter: {
                    htmlextra: { export: file_path }, // Không xuất ra tệp
                },
            },
            function (err, summary) {
                if (err) {
                    reject(err);
                } else {
                    resolve(summary);
                }
            }
        );
    });

    let htmlContent = fs.readFileSync(file_path);
    fs.unlinkSync(file_path);
    return htmlContent;
}
