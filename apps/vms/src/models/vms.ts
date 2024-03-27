import mongoose from "mongoose";
import { IVms } from "../interfaces/models/vms";

const vmsSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            require: true,
        },
        host: {
            type: String,
            require: true,
        },
        user: {
            type: String,
            require: true,
        },
        pass: {
            type: String,
            require: true,
        },
        last_connect: {
            type: Date,
            require: false,
        },
    },
    {
        versionKey: false,
    }
);

const Vms = mongoose.model<IVms>("Vms", vmsSchema);

export default Vms;
