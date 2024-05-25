import mongoose from "mongoose";
import { IHistory } from "../interfaces/models";

const historyEmail = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        service_name: {
            type: String,
            require: true,
        },
        email_to: [
            {
                type: String,
                require: true,
            },
        ],
        code_template: {
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
        content: {
            type: String,
            require: true,
        },
        params_content: {
            type: Object,
            require: true,
        },
        params_subject: {
            type: Object,
            require: true,
        },
    },
    {
        versionKey: false,
    }
);

export type IHistoryEmailModel = IHistory;

const History = mongoose.model<IHistoryEmailModel>("History", historyEmail);
export default History;
