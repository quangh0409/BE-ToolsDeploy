import axios from "axios";
import { configs } from "../configs";
import { ILastCommit } from "../interfaces/response/git.body";
import { HttpError, error } from "app";

export async function GetLastCommitByAccessToken(params: {
    userId: string;
    repository: string;
    branch: string;
}): Promise<{ body?: ILastCommit; status: number }> {
    const url = `${configs.services.git.getUrl()}/last-commit`;
    try {
        const res = await axios.post<ILastCommit>(`${url}`, params);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}

export async function GetReposGitByAccessToken(params: {
    userId: string;
    name?: string;
}): Promise<{ body?: any; status: number }> {
    const url = `${configs.services.git.getUrl()}/repos`;
    try {
        const res = await axios.post<any>(`${url}`, params);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}