import { error, HttpError, HttpStatus } from "app";
import axios from "axios";
import { configs } from "../configs";

export async function sendMailGoogleNewAccount(params: {
    password: string;
    username: string;
    email: string;
}): Promise<void> {
    const url = `${configs.services.mail.getUrl()}`;
    const err = error.service(url);
    try {
        const { status } = await axios.post(`${url}/new-account`, params);
        if (status !== HttpStatus.OK) {
            throw new HttpError(err);
        }
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            if (e.response.status !== HttpStatus.OK) {
                throw new HttpError(err);
            }
        } else {
            throw new HttpError(err);
        }
    }
}

export async function sendMailGoogleForgotPassword(params: {
    password: string;
    username: string;
    email: string;
}): Promise<void> {
    const url = `${configs.services.mail.getUrl()}`;
    const err = error.service(url);
    try {
        const { status } = await axios.post(`${url}/forgot-password`, params);
        if (status !== HttpStatus.OK) {
            throw new HttpError(err);
        }
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status) {
            if (e.response.status !== HttpStatus.OK) {
                throw new HttpError(err);
            }
        } else {
            throw new HttpError(err);
        }
    }
}
