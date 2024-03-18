import axios from "axios";
import { configs } from "../configs";
import { ICreateUser } from "../interfaces/request/user.body";
import { HttpError, error } from "app";

export async function createUser(
    params: ICreateUser
): Promise<{ body?: ICreateUser; status?: number }> {
    const url = `${configs.services.user.getUrl()}`;
    try {
        const res = await axios.post<ICreateUser>(`${url}`, params);
        return { body: res.data };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}
