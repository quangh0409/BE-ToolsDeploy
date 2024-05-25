import { ITEmail } from "./../interfaces/models/mail";
import mongoose from "mongoose";

const templateEmail = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            require: true,
        },
        subject: {
            type: String,
            require: true,
        },
        content: {
            type: String,
            require: true,
        },
        created_time: {
            type: Date,
            require: true,
            default: new Date(),
        },
        created_by: {
            type: String,
            require: false,
        },
        updated_time: {
            type: Date,
            require: true,
            default: new Date(),
        },
        updated_by: {
            type: String,
            require: false,
        },
    },
    {
        versionKey: false,
    }
);

export type ITempalteEmailModel = ITEmail;

const Email = mongoose.model<ITempalteEmailModel>("Template", templateEmail);
export default Email;
