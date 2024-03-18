import mongoose from "mongoose";
import { IGIT } from "../interfaces/models";

const gitSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            require: true,
        },
        git_id: {
            type: String,
            require: true,
        },
        access_token: {
            type: String,
            require: true,
        },
        token_type: {
            type: String,
            require: true,
        },
        scope: {
            type: String,
            require: false,
        },
    },
    {
        versionKey: false,
    }
);

const Github = mongoose.model<IGIT>("Github", gitSchema);
export default Github;
