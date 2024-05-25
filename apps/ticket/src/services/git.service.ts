import axios from "axios";
import { configs } from "../configs";
import { HttpError, error } from "app";
import { IGit } from "../interfaces/response/git.body";

export async function getGithubById(params: {
    git_id: string;
}): Promise<{ body?: IGit; status: number }> {
    const url = `${configs.services.git.getUrl()}/${params.git_id}`;
    try {
        const res = await axios.get<IGit>(`${url}`);
        return { body: res.data, status: res.status };
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            return { status: e.response?.status };
        } else {
            throw new HttpError(error.service(url));
        }
    }
}
