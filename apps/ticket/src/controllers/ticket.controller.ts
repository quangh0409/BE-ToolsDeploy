import { HttpError, HttpStatus, ResultSuccess, success } from "app";
import { ITicket } from "../interfaces/models/ticket";
import Ticket from "../models/ticket";
import { getUserById } from "../services/user.service";
import { getGithubById } from "../services/git.service";
import { UpdateQuery } from "mongoose";
import { v1 } from "uuid";

export async function createdTicket(params: {
    github_id?: string;
    gitlab_id?: string;
    user_id: string;
    vms_ids?: string[];
    standard_ids?: string[];
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
        id: v1(),
        github_id: params.github_id,
        gitlab_id: params.gitlab_id,
        user_id: params.user_id,
        vms_ids: params.vms_ids,
        standard_ids: params.standard_ids,
    });

    await ticket.save();

    return success.ok(ticket);
}

export async function updateTicket(params: {
    user_id: string;
    vms_ids?: string;
    standard_ids?: string;
}) {
    const set: UpdateQuery<ITicket> = {};
    if (params.vms_ids) {
        set.$push = {
            ...set.$push,
            vms_ids: params.vms_ids,
        };
    }
    if (params.standard_ids) {
        set.$push = {
            ...set.$push,
            standard_ids: params.standard_ids,
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
    const result = { ...ticket.toJSON() };
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

export async function deleteVmsOfTicketById(params: {
    ticket: string;
    vm: string;
}): Promise<ResultSuccess> {
    const ticket = await Ticket.findOne({ id: params.ticket });

    if (!ticket) {
        throw new HttpError({
            status: HttpStatus.NOT_FOUND,
            code: "TICKET_NOT_EXITS",
            errors: [
                {
                    param: "ticket",
                    location: "params",
                    value: params.ticket,
                },
            ],
        });
    }

    const vms = ticket.vms_ids.filter((id) => id !== params.vm);

    if (vms.length === ticket.vms_ids.length - 1) {
        ticket.vms_ids = vms;
        await ticket.save();
        return success.ok({ isDelete: true });
    }

    return success.ok({ isDelete: false });
}

export async function deleteStandardOfTicketById(params: {
    ticket: string;
    standard: string;
}): Promise<ResultSuccess> {
    const ticket = await Ticket.findOne({ id: params.ticket });

    if (!ticket) {
        throw new HttpError({
            status: HttpStatus.NOT_FOUND,
            code: "TICKET_NOT_EXITS",
            errors: [
                {
                    param: "ticket",
                    location: "params",
                    value: params.ticket,
                },
            ],
        });
    }

    const standards = ticket.standard_ids.filter(
        (id) => id !== params.standard
    );

    if (standards.length === ticket.standard_ids.length - 1) {
        ticket.standard_ids = standards;
        await ticket.save();
        return success.ok({ isDelete: true });
    }

    return success.ok({ isDelete: false });
}
