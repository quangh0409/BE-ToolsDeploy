import axios from "axios";
import { configs } from "../configs";
import { IUser } from "../interfaces/response/user.body";
import { HttpError, error } from "app";

export async function getUserById(params: {
    user_id: string;
}): Promise<{ body?: IUser; status: number }> {
    const url = `${configs.services.users.getUrl()}/${params.user_id}`;
    try {
        const res = await axios.get<IUser>(`${url}`);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}
