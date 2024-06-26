import mongoose from "mongoose";
import { ITicket } from "../interfaces/models/ticket";

const ticketSchame = new mongoose.Schema(
    {
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
        vms_ids: [
            {
                type: String,
                require: false,
            },
        ],
        standard_ids: [
            {
                type: String,
                require: false,
            },
        ],
    },
    {
        versionKey: false,
    }
);

const Ticket = mongoose.model<ITicket>("Ticket", ticketSchame);
export default Ticket;
