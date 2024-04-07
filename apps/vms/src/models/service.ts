import mongoose from "mongoose";
import { IService } from "../interfaces/models/service";

const serviceSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            require: true,
        },
        name: {
            type: String,
            require: true,
        },
        architectura: {
            type: String,
            require: true,
        },
        language: {
            type: String,
            require: true,
        },
        repo: {
            type: String,
            require: true,
        },
        source: {
            type: String,
            require: true,
        },
        environment: [
            {
                type: {
                    name: {
                        type: String,
                        required: true,
                    },
                    vm: {
                        type: String,
                        required: true,
                    },
                    branch: {
                        type: String,
                        require: true,
                    },
                    docker_file: {
                        type: [{
                            location: {
                                type: String,
                                require: true,
                            },
                            content: {
                                type: String,
                                require: true,
                            },
                            name: {
                                type: String,
                                require: true,
                            },
                        }],
                        require: true,
                        _id: false,
                    },
                    docker_compose: {
                        type: [{
                            location: {
                                type: String,
                                require: true,
                            },
                            content: {
                                type: String,
                                require: true,
                            },
                            name: {
                                type: String,
                                require: true,
                            },
                        }],
                        require: true,
                        _id: false,
                    },
                },
                required: true,
                _id: false,
            },
        ],
    },
    {
        versionKey: false,
    }
);

const Service = mongoose.model<IService>("Service", serviceSchema);
export default Service;
