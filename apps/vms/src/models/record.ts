import mongoose from "mongoose";
import { EStatus, IRecord } from "../interfaces/models";

const oceanSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            require: true,
        },
        status: {
            type: String,
            enum: EStatus,
            require: true,
        },
        time: {
            type: String,
            require: true,
        },
    },
    {
        _id: false,
        versionKey: false,
    }
);

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
    },
    {
        versionKey: false,
    }
);

const Record = mongoose.model<IRecord>("Record", recordSchema);
export default Record;
