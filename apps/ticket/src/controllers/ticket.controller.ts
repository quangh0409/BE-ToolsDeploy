import { HttpError, HttpStatus, ResultSuccess, success } from "app";
import { ITicket } from "../interfaces/models/ticket";
import { Result } from "ioredis";
import Ticket from "../models/ticket";

export async function createdTicket(params: {
    github_id?: string;
    gitlab_id?: string;
    user_id: string;
    image_ids?: string[];
    record_ids?: string[];
}): Promise<ResultSuccess> {
    const check = await Ticket.findOne({ user_id: params.user_id });

    if (check) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "TICKET_EXITSED",
            errors: [
                {
                    param: "user_id",
                    location: "body",
                    value: params.user_id,
                },
            ],
        });
    }

    const ticket = new Ticket({
        github_id: params.github_id,
        gitlab_id: params.gitlab_id,
        user_id: params.user_id,
        image_ids: params.image_ids,
        record_ids: params.record_ids,
    });

    await ticket.save();

    return success.ok(ticket);
}

export async function findTicketByUserId(params: {
    user_id: string;
}): Promise<ResultSuccess> {
    const ticket = await Ticket.findOne({ user_id: params.user_id });

    if (!ticket) {
        throw new HttpError({
            status: HttpStatus.NOT_FOUND,
            code: "TICKET_NOT_EXITS",
            errors: [
                {
                    param: "user_id",
                    location: "params",
                    value: params.user_id,
                },
            ],
        });
    }
    return success.ok(ticket);
}

export async function findTicketByGithubId(params: {
    github_id: string;
}): Promise<ResultSuccess> {
    const ticket = await Ticket.findOne({ github_id: params.github_id });

    if (!ticket) {
        throw new HttpError({
            status: HttpStatus.NOT_FOUND,
            code: "TICKET_NOT_EXITS",
            errors: [
                {
                    param: "github_id",
                    location: "params",
                    value: params.github_id,
                },
            ],
        });
    }
    return success.ok(ticket);
}

export async function checkTicketExitsByUserId(params: {
    user_id: string;
}): Promise<ResultSuccess> {
    const ticket = await Ticket.findOne({ user_id: params.user_id });

    if (ticket) {
        return success.ok({ exits: true });
    }
    return success.ok({ exits: false });
}

export async function checkTicketExitsByGithubId(params: {
    github_id: string;
}): Promise<ResultSuccess> {
    const ticket = await Ticket.findOne({ github_id: params.github_id });

    if (ticket) {
        return success.ok({ exits: true });
    }
    return success.ok({ exits: false });
}
