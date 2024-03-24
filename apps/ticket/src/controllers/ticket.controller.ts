import { HttpError, HttpStatus, ResultSuccess, success } from "app";
import { ITicket } from "../interfaces/models/ticket";
import { Result } from "ioredis";
import Ticket from "../models/ticket";
import { getUserById } from "../services/user.service";
import { getGithubById } from "../services/git.service";
import { UpdateQuery } from "mongoose";

export async function createdTicket(params: {
    github_id?: string;
    gitlab_id?: string;
    user_id: string;
    vms_ids?: string[];
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
        vms_ids: params.vms_ids,
        record_ids: params.record_ids,
    });

    await ticket.save();

    return success.ok(ticket);
}

export async function updateTicket(params: {
    user_id: string;
    vms_ids?: string;
    record_ids?: string;
}) {
    const set: UpdateQuery<ITicket> = {};
    if (params.vms_ids) {
        set.$push = {
            ...set.$push,
            vms_ids: params.vms_ids,
        };
    }
    if (params.record_ids) {
        set.$push = {
            ...set.$push,
            record_ids: params.record_ids,
        };
    }

    const check = await Ticket.findOneAndUpdate(
        {
            user_id: params.user_id,
        },
        set,
        { new: true }
    );

    if (!check) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "TICKET_NOT_EXIT",
            errors: [
                {
                    param: "user_id",
                    location: "body",
                    value: params.user_id,
                },
            ],
        });
    }

    return success.ok(check);
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

export async function findTicketDetailByUserId(params: {
    user_id: string;
}): Promise<ResultSuccess> {
    const ticket = await Ticket.findOne(
        { user_id: params.user_id },
        { _id: 0, __v: 0 }
    );

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
    let result = { ...ticket.toJSON() };
    const user = await getUserById({ user_id: ticket.user_id });
    if (user.body) {
        Object.assign(result, {
            user: {
                ...user.body,
            },
            user_id: undefined,
        });
    }

    if (ticket.github_id) {
        const github = await getGithubById({ git_id: ticket.github_id });
        Object.assign(result, { github: github.body, github_id: undefined });
    }

    return success.ok(result);
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
