import mongoose from "mongoose";
import { IStandard } from "../interfaces/models";
import { ITemplate } from "../interfaces/models/template";

const TemplateSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            require: true,
        },
        name: {
            type: String,
            require: true,
        },
        language: {
            type: String,
            require: true,
        },
        architecture: {
            type: String,
            require: true,
        },
        content: {
            type: String,
            require: true,
        },
        type: {
            type: String,
            require: true,
        },
    },
    {
        versionKey: false,
    }
);

const Template = mongoose.model<ITemplate>("Template", TemplateSchema);
export default Template;
