import axios from "axios";
import { configs } from "../configs";
import { ICreatedGithub, IGIT } from "../interfaces/response";
import { HttpError, error } from "app";

export async function getAGithubByCode(params: {
    code: string;
}): Promise<{ body?: IGIT; status?: number }> {
    const url = `${configs.services.git.getUrl()}/handle-code?code=${
        params.code
    }`;
    try {
        const res = await axios.get<IGIT>(`${url}`);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}

export async function GetInfoUserGitByAccesToken(params: {
    token?: string;
}): Promise<{ body?: any; status?: number }> {
    const url = `${configs.services.git.getUrl()}/user-git-token`;
    try {
        const res = await axios.post(`${url}`, params);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}

export async function createGitHub(
    params: ICreatedGithub
): Promise<{ body?: any; status?: number }> {
    const url = `${configs.services.git.getUrl()}/`;
    try {
        const res = await axios.post<ICreatedGithub>(`${url}`, params);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}

export async function updateGitHub(
    params: ICreatedGithub
): Promise<{ body?: any; status?: number }> {
    const url = `${configs.services.git.getUrl()}/`;
    try {
        const res = await axios.put<ICreatedGithub>(`${url}`, params);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}
