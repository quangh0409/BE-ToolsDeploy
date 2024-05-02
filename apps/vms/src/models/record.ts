import mongoose from "mongoose";
import { EStatus, IRecord } from "../interfaces/models";

const recordSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            require: true,
        },
        status: {
            type: String,
            enum: EStatus,
            require: true,
        },
        ocean: {
            type: mongoose.Schema.Types.Mixed,
            require: true,
        },
        logs: {
            type: mongoose.Schema.Types.Mixed,
            require: true,
        },
        created_time: {
            type: Date,
            require: true,
        },
        commit_id: {
            type: String,
            require: true,
        },
        commit_message: {
            type: String,
            require: true,
        },
        index: {
            type: Number,
            require: true,
        },
        branch: {
            type: String,
            require: true,
        },
        end_time: {
            type: Date,
            require: true,
        },
    },
    {
        versionKey: false,
    }
);

const Record = mongoose.model<IRecord>("Record", recordSchema);
export default Record;
