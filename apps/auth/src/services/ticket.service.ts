import axios from "axios";
import { configs } from "../configs";
import { HttpError, error } from "app";
import { ITicket } from "../interfaces/response/ticket.body";

export async function checkTicketExitsByGithubId(params: {
    github_id: string;
}): Promise<{ body?: { exits: boolean }; status?: number }> {
    const url = `${configs.services.ticket.getUrl()}/check-ticket-by-github/${
        params.github_id
    }`;
    try {
        const res = await axios.get<{ exits: boolean }>(`${url}`);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}

export async function findTicketByGithubId(params: {
    github_id: string;
}): Promise<{ body?: ITicket; status?: number }> {
    const url = `${configs.services.ticket.getUrl()}/by-github-id?github_id=${
        params.github_id
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

export async function createdTicket(
    params: ITicket
): Promise<{ body?: ITicket; status?: number }> {
    const url = `${configs.services.ticket.getUrl()}/`;
    try {
        const res = await axios.post<ITicket>(`${url}`, params);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}
