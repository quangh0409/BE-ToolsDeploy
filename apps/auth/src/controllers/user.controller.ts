import { v1 } from "uuid";
import {
    error,
    HttpError,
    HttpStatus,
    Result,
    ResultSuccess,
    success,
} from "app";
import { IUser, UserAction } from "../interfaces/models";
import mongoose, { FilterQuery, PipelineStage } from "mongoose";
import { createAccount } from "./account.controller";
import { parseQuery, parseSort, ParseSyntaxError } from "mquery";
import { Account, User } from "../models";
import { sendMailGoogleNewAccount } from "../services/mail.service";
import {
    createGitHub,
    getAGithubByCode,
    GetInfoUserGitByAccesToken,
} from "../services/git.service";
import {
    checkTicketExitsByGithubId,
    createdTicket,
} from "../services/ticket.service";
import { genAccessToken, genRefreshToken } from "../token";
import { saveTokenSignature } from "./auth.controller";

export async function createUser(params: {
    email: string;
    password: string;
    fullname: string;
    roles: string[];
    avatar?: string;
}): Promise<ResultSuccess> {
    await checkEmailExists(params.email);

    const user = new User({
        id: v1(),
        fullname: params.fullname,
        email: params.email,
        is_active: true,
        activities: [],
        avatar: params.avatar,
        created_time: new Date(),
    });

    await Promise.all([
        createAccount([
            {
                id: user.id,
                email: params.email,
                password: params.password,
                is_active: true,
                roles: params.roles,
            },
        ]),
        user.save(),
        sendMailGoogleNewAccount({
            password: params.password,
            username: params.fullname,
            email: params.email,
        }),
    ]);
    const data = {
        ...user.toJSON(),
        _id: undefined,
        is_active: undefined,
        activities: undefined,
    };
    return success.created(data);
}

export async function createUserByGithub(params: {
    code: string;
}): Promise<ResultSuccess> {
    const github = await getAGithubByCode({ code: params.code });

    if (!github || github.status !== 200) {
        throw new HttpError({
            code: "GIT_CODE_ERROR",
            status: HttpStatus.UNAUTHORIZED,
            errors: [
                {
                    location: "query",
                    param: "code",
                    value: params.code,
                },
            ],
        });
    }

    const infoUserGit = await GetInfoUserGitByAccesToken({
        token: github.body?.access_token,
    });
    const checkTicket = await checkTicketExitsByGithubId({
        github_id: infoUserGit.body.id,
    });

    if (infoUserGit.body.email === null) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "GIT_LOCK_EMAIL",
            errors: [
                {
                    param: "github",
                    location: "param",
                    message: `The Github account is currently set to private email, please change it to public.`,
                },
            ],
        });
    }

    if (checkTicket.status === 200 && !checkTicket.body!.exits) {
        await createGitHub({
            access_token: github.body!.access_token,
            token_type: github.body!.token_type,
            scope: github.body!.scope,
            git_id: infoUserGit.body.id,
            git_user: infoUserGit.body.login,
        });

        const user = await createUser({
            email: infoUserGit.body.email,
            password: github.body!.access_token,
            fullname: infoUserGit.body.name,
            roles: ["U"],
            avatar: infoUserGit.body.avatar_url,
        });
        if (user.status === 201) {
            await createdTicket({
                id: v1(),
                user_id: user.data.id,
                github_id: infoUserGit.body.id,
            });

            const account = await Account.findOne({ id: user.data.id });

            if (account) {
                const accessToken = genAccessToken({
                    id: account.id,
                    roles: account.roles,
                    email: account.email,
                });
                const refreshToken = genRefreshToken(account.id);
                const data = {
                    ...{
                        ...user.data,
                        _id: undefined,
                    },
                    accessToken: accessToken.token,
                    refreshToken: refreshToken.token,
                    roles: account.roles,
                    activities: undefined,
                };

                await saveTokenSignature({
                    userId: user.data.id,
                    token: accessToken.token,
                    expireAt: accessToken.expireAt,
                });
                return success.created(data);
            }
        }
    }
    throw new HttpError({
        status: HttpStatus.BAD_REQUEST,
        code: "GIT_EXISTED",
        errors: [
            {
                param: "github",
                location: "param",
                message: `tài khoản Github ${infoUserGit.body.name} (${infoUserGit.body.email})`,
            },
        ],
    });
}

export async function registerGithubWithAccount(params: {
    code: string;
    userId: string;
}): Promise<ResultSuccess> {
    const github = await getAGithubByCode({ code: params.code });

    if (!github || github.status !== 200) {
        throw new HttpError({
            code: "GIT_CODE_ERROR",
            status: HttpStatus.UNAUTHORIZED,
            errors: [
                {
                    location: "query",
                    param: "code",
                    value: params.code,
                },
            ],
        });
    }

    const infoUserGit = await GetInfoUserGitByAccesToken({
        token: github.body?.access_token,
    });
    const checkTicket = await checkTicketExitsByGithubId({
        github_id: infoUserGit.body.id,
    });

    if (infoUserGit.body.email === null) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "GIT_LOCK_EMAIL",
            errors: [
                {
                    param: "github",
                    location: "param",
                    message: `The Github account is currently set to private email, please change it to public.`,
                },
            ],
        });
    }

    if (checkTicket.status === 200 && !checkTicket.body!.exits) {
        await Promise.all([
            createGitHub({
                access_token: github.body!.access_token,
                token_type: github.body!.token_type,
                scope: github.body!.scope,
                git_id: infoUserGit.body.id,
                git_user: infoUserGit.body.login,
            }),
            createdTicket({
                id: v1(),
                user_id: params.userId,
                github_id: infoUserGit.body.id,
            }),
        ]);

        return success.ok({
            message: "Connect Github successfully",
        });
    }
    throw new HttpError({
        status: HttpStatus.BAD_REQUEST,
        code: "GIT_EXISTED",
        errors: [
            {
                param: "github",
                location: "param",
                message: `tài khoản Github ${infoUserGit.body.name} (${infoUserGit.body.email})`,
            },
        ],
    });
}

export async function updateUser(params: {
    id: string;
    fullname?: string;
    phone?: string;
    roles?: string[];
    is_active?: boolean;
    userId: string;
    userRoles: string[];
}): Promise<Result> {
    if (!params.userRoles.includes("SA")) {
        if (params.roles?.includes("SA")) {
            return error.actionNotAllowed();
        }
    }

    if (
        params.roles &&
        params.roles?.length > 1 &&
        params.roles?.includes("SA")
    ) {
        return error.actionNotAllowed();
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    const user = await User.findOneAndUpdate(
        { id: params.id },
        {
            $set: {
                fullname: params.fullname,
                phone: params.phone,
                updated_time: new Date(),
            },
            $push: {
                activities: {
                    action: UserAction.UPDATE,
                    actor: params.userId,
                    time: new Date(),
                },
            },
        },
        { session, new: true, projection: { activities: 0 } }
    );
    const account = await Account.findOneAndUpdate(
        { id: params.id },
        {
            $set: {
                roles: params.roles,
                is_active: params.is_active,
            },
        },
        { session }
    );
    if (user != null && account != null) {
        const change = {
            fullname: params.fullname,
            phone: params.phone,
            roles: params.roles,
            username: user.fullname,
            email: user.email,
        };
        if (params.userRoles.includes("SA")) {
        }

        await session.commitTransaction();
        session.endSession();
        const data = {
            ...user.toJSON(),
            roles: account?.roles,
            _id: undefined,
        };
        return success.ok(data);
    } else {
        await session.abortTransaction();
        session.endSession();
        return error.notFound({
            location: "body",
            param: "id",
            value: params.id,
            message: "the user does not exist",
        });
    }
}

export async function findUser(params: {
    query?: string;
    sort?: string;
    size: number;
    page: number;
    userRoles: string[];
}): Promise<Result> {
    let filter: FilterQuery<IUser> = {};
    let sort: undefined | Record<string, 1 | -1> = undefined;
    const facetData =
        params.size == -1
            ? []
            : [
                  { $skip: params.size * params.page },
                  { $limit: params.size * 1 },
              ];
    const facet = {
        meta: [{ $count: "total" }],
        data: facetData,
    };
    try {
        const userFilter = params.query && parseQuery(params.query);
        userFilter && (filter = { $and: [filter, userFilter] });
        params.sort && (sort = parseSort(params.sort));
    } catch (e) {
        const err = e as unknown as ParseSyntaxError;
        const errorValue =
            err.message === params.sort ? params.sort : params.query;
        throw new HttpError(
            error.invalidData({
                location: "query",
                param: err.type,
                message: err.message,
                value: errorValue,
            })
        );
    }

    const pipeline: PipelineStage[] = [{ $match: filter }];
    sort && pipeline.push({ $sort: sort });
    pipeline.push({ $project: { _id: 0, activities: 0 } }, { $facet: facet });
    const result = await User.aggregate(pipeline)
        .collation({ locale: "vi" })
        .then((res) => res[0])
        .then((res) => {
            const total = !(res.meta.length > 0) ? 0 : res.meta[0].total;
            let totalPage = Math.ceil(total / params.size);
            totalPage = totalPage > 0 ? totalPage : 1;
            return {
                page: Number(params.page),
                total: total,
                total_page: totalPage,
                data: res.data,
            };
        });

    return success.ok(result);
}

export async function getUserById(params: {
    id: string;
    userId: string;
    userRoles: string[];
}): Promise<Result> {
    const filter: FilterQuery<IUser> = { id: params.id };
    const [user, account] = await Promise.all([
        User.findOne(filter, {
            _id: 0,
            created_time: 0,
            updated_time: 0,
            is_active: 0,
        }),
        Account.findOne({ id: params.id }, { _id: 0 }),
    ]);

    return error.notFound({
        location: "body",
        param: "userId",
        value: params.id,
        message: "the user does not exist",
    });
}

export async function getUserByEmail(params: {
    email: string;
}): Promise<ResultSuccess> {
    let filter: FilterQuery<IUser>;

    filter = { email: params.email };

    const user = await User.findOne(filter, { _id: 0 });
    if (user) {
        const data = {
            ...user.toJSON(),
        };
        return success.ok(data);
    } else {
        throw error.notFound({
            location: "body",
            param: "email",
            value: params.email,
            message: "the user does not exist",
        });
    }
}

export async function _getUserById(userId: string): Promise<ResultSuccess> {
    const user = await User.findOne({ id: userId });
    if (!user) {
        throw error.notFound({
            param: "userId",
            value: userId,
            message: `the user does not exist`,
        });
    }
    return success.ok({ ...user.toJSON(), _id: undefined });
}

async function checkEmailExists(email: string): Promise<void> {
    const existedUser = await User.findOne({
        email: { $regex: `^${email}$`, $options: "i" },
    });
    if (existedUser) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "REGISTERED_EMAIL",
            errors: [
                {
                    param: "email",
                    location: "body",
                    value: email,
                },
            ],
        });
    }
}
