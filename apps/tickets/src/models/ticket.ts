import mongoose from "mongoose";
import { ITicket } from "../interfaces/models/ticket";

const ticketSchame = new mongoose.Schema({
    id: {
        type: String,
        require: true,
    },
    github_id: {
        type: String,
        require: false,
    },
    gitlab_id: {
        type: String,
        require: false,
    },
    user_id: {
        type: String,
        require: true,
    },
    image_ids: [
        {
            type: String,
            require: false,
        },
    ],
    record_ids: [
        {
            type: String,
            require: false,
        },
    ],
});

const Ticket = mongoose.model<ITicket>("Ticket", ticketSchame);
export default Ticket;
