import axios from "axios";
import { configs } from "../configs";
import { IDelete, ITicket } from "../interfaces/response/ticket.body";
import { HttpError, error } from "app";

export async function findTicketByUserId(params: {
    user_id: string;
}): Promise<{ body?: ITicket; status: number }> {
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

export async function findTicketByGithubId(params: {
    github_id: string;
}): Promise<{ body?: ITicket; status: number }> {
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

export async function deleteVmsOfTicketById(params: {
    ticket: string;
    vm: string;
}): Promise<{ body?: IDelete; status: number }> {
    const url = `${configs.services.ticket.getUrl()}/delete-vms`;
    try {
        const res = await axios.post<IDelete>(`${url}`, params);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}

export async function deleteStandardOfTicketById(params: {
    ticket: string;
    standard: string;
}): Promise<{ body?: IDelete; status: number }> {
    const url = `${configs.services.ticket.getUrl()}/delete-standard`;
    try {
        const res = await axios.post<IDelete>(`${url}`, params);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}

export async function updateTicket(params: {
    user_id: string;
    vms_ids?: string;
    standard_ids?: string;
}): Promise<{ body?: ITicket; status: number }> {
    const url = `${configs.services.ticket.getUrl()}/`;
    try {
        const res = await axios.put<ITicket>(`${url}`, params);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}
