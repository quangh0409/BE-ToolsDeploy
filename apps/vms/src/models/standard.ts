import mongoose from "mongoose";
import { IStandard } from "../interfaces/models";

const standardSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            require: true,
        },
        name: {
            type: String,
            require: true,
        },
        ram: {
            type: String,
            require: true,
        },
        cpu: {
            type: String,
            require: true,
        },
        core: {
            type: String,
            require: true,
        },
        os: {
            type: String,
            require: true,
        },
        architecture: {
            type: String,
            require: true,
        },
    },
    {
        versionKey: false,
    }
);

const Standard = mongoose.model<IStandard>("Standard", standardSchema);
export default Standard;
