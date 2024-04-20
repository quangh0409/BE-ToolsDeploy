import mongoose from "mongoose";
import { EStatus, IVms } from "../interfaces/models/vms";
import { service } from "app/build/result/error";

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
        status: {
            type: String,
            enum: EStatus,
            require: true,
        },
        last_connect: {
            type: Date,
            require: false,
        },
        services: [
            {
                type: String,
                require: false,
            },
        ],
        operating_system: {
            type: String,
            require: false,
        },
        kernel: {
            type: String,
            require: false,
        },
        architecture: {
            type: String,
            require: false,
        },
        home_url: {
            type: String,
            require: false,
        },
        support_url: {
            type: String,
            require: false,
        },
        bug_report_url: {
            type: String,
            require: false,
        },
        privacy_policy_url: {
            type: String,
            require: false,
        },
        cpus: {
            type: String,
            require: false,
        },
        cores: {
            type: String,
            require: false,
        },
        sockets: {
            type: String,
            require: false,
        },
        ram: {
            type: String,
            require: false,
        },
        thread: {
            type: String,
            require: false,
        },
        set_up: {
            type: {
                docker: {
                    type: String,
                    require: false,
                },
                hadolint: {
                    type: String,
                    require: false,
                },
                trivy: {
                    type: String,
                    require: false,
                },
            },
            _id: false,
            require: false,
        },
    },
    {
        versionKey: false,
    }
);

const Vms = mongoose.model<IVms>("Vms", vmsSchema);

export default Vms;
