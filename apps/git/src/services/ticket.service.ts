import axios from "axios";
import { configs } from "../configs";
import { ITicket } from "../interfaces/response/ticket.body";
import { HttpError, error } from "app";

export async function findTicketByUserId(params: {
    user_id: string;
}): Promise<{ body?: ITicket; status?: number }> {
    const url = `${configs.services.ticket.getUrl()}/by-user-id?user_id=${
        params.user_id
    }`;
    try {
        const res = await axios.get<ITicket>(`${url}`);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}