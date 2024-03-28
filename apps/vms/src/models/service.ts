import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    id: {
        type: String,
        require: true,
    },
    name: {
        type: String,
        require: true,
    },
    branch: {
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
    docker_file: {
        type: String,
        require: true,
    },
    docker_compose: {
        type: String,
        require: true,
    },
});
