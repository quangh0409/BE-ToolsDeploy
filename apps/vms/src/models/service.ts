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
        user: {
            type: String,
            require: true,
        },
        environment: {
            type: [
                {
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
                        type: [
                            {
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
                            },
                        ],
                        require: true,
                        _id: false,
                    },
                    docker_compose: {
                        type: [
                            {
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
                            },
                        ],
                        require: true,
                        _id: false,
                    },
                    postman: {
                        type: {
                            collection: {
                                type: {
                                    content: {
                                        type: String,
                                        require: true,
                                    },
                                    name: {
                                        type: String,
                                        require: true,
                                    },
                                },
                                _id: false,
                                required: true,
                            },
                            environment: {
                                type: {
                                    content: {
                                        type: String,
                                        require: true,
                                    },
                                    name: {
                                        type: String,
                                        require: true,
                                    },
                                },
                                _id: false,
                                required: true,
                            },
                        },
                        required: false,
                        _id: false,
                    },
                    record: {
                        type: [String],
                        required: false,
                    },
                },
            ],
            required: true,
            _id: false,
        },
        activities: {
            type: [
                {
                    name_env: {
                        type: String,
                        required: true,
                    },
                    modify_time: {
                        type: Date,
                        required: true,
                    },
                    record_id: {
                        type: String,
                        required: true,
                    },
                    vm: {
                        type: String,
                        required: true,
                    },
                },
            ],
            required: false,
            _id: false,
        },
    },
    {
        versionKey: false,
    }
);

const Service = mongoose.model<IService>("Service", serviceSchema);
export default Service;
