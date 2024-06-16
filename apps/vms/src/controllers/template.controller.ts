import { ResultSuccess, success } from "app";
import Template from "../models/template";

export async function findTemplate(params: {
    language: string;
    architecture: string;
    type: string;
}): Promise<ResultSuccess> {
    const templates = await Template.find(
        {
            $and: [
                { language: params.language },
                { architecture: params.architecture },
                { type: params.type },
            ],
        },
        { _id: 0 }
    );

    return success.ok(templates);
}

export async function createTemplate(params: {
    name: string;
    language: string;
    architecture: string;
    content: string;
    type: string;
}): Promise<ResultSuccess> {
    const tempalte = new Template({
        name: params.name,
        language: params.language,
        architecture: params.architecture,
        content: params.content,
        type: params.type,
    });

    await tempalte.save();

    return success.created(tempalte);
}
