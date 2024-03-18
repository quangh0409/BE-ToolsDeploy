import axios from "axios";
import { ILoginRes } from "../interfaces/response/user.body";
import { configs } from "../configs";
import { HttpError, error } from "app";

export async function login(
    params:  {
        email: string;
        password: string;
    }
): Promise<{ body?: ILoginRes; status?: number }> {
    const url = `${configs.services.auth.getUrl()}/login`;
    try {
        const res = await axios.post<ILoginRes>(`${url}`, params);
        return { body: res.data };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}