import { v1 } from "uuid";
import {
    error,
    HttpError,
    HttpStatus,
    Result,
    ResultSuccess,
    success,
} from "app";
import {
    IUser,
    UserAction,
} from "../interfaces/models";
import mongoose, { FilterQuery, PipelineStage } from "mongoose";
import { createAccount } from "./account.controller";
import { parseQuery, parseSort, ParseSyntaxError } from "mquery";
import { Account, User } from "../models";
import { ImportUserReqBody } from "../interfaces/request";

export async function createUser(params: {
    email: string;
    password: string;
    number: string;
    fullname: string;
    phone?: string;
    roles: string[];
    avatar?: string;
    is_active: boolean;
    userRoles: string[];
    userId: string;
}): Promise<Result> {
    console.log("🚀 ~ file: user.controller.ts:34 ~ params:", params);

    if (!params.userRoles.includes("SA")) {
        if (params.roles?.includes("SA")) {
            return error.actionNotAllowed();
        }
    }
    await checkEmailExists(params.email);


    const user = new User({
        id: v1(),
        fullname: params.fullname,
        email: params.email,
        number: params.number,
        phone: params.phone,
        is_active: params.is_active,
        activities: [
            {
                action: UserAction.CREATE,
                actor: params.userId,
                time: new Date(),
            },
        ],
    });

    await Promise.all([
        createAccount([
            {
                id: user.id,
                email: params.email,
                password: params.password,
                is_active: params.is_active,
                roles: params.roles,
            },
        ]),
        user.save(),
    ]);
    const data = {
        ...user.toJSON(),
        _id: undefined,
        is_active: undefined,
        activities: undefined,
    };
    return success.created(data);
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
            created_by: 0,
            created_time: 0,
            updated_time: 0,
            is_active: 0,
        }),
        Account.findOne({ id: params.id }, { _id: 0 }),
    ]);

    const research_area: { [key: string]: string | number | undefined }[] = [];

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
    const user = await User.findOne(
        { id: userId },
        {
            _id: 0,
            password: 0,
            created_by: 0,
            created_time: 0,
            updated_time: 0,
            is_active: 0,
            activities: 0,
        }
    );
    if (!user) {
        throw error.notFound({
            param: "userId",
            value: userId,
            message: `the user does not exist`,
        });
    }
    return success.ok(user);
}

export async function updateUserActivity(params: {
    id: string;
    action: string;
    actor: string;
}): Promise<void> {
    const user = await User.findOneAndUpdate(
        { id: params.id, is_active: true },
        {
            $push: {
                activities: {
                    action: params.action,
                    actor: params.actor,
                    time: new Date(),
                },
            },
        },
        { projection: { _id: 0 } }
    ).lean();
    if (!user) {
        const err = error.notFound({
            param: "userId",
            value: params.id,
            message: `the user does not exist`,
        });
        throw new HttpError(err);
    }
}

export async function getUserByIds(ids: string[]): Promise<Result> {
    const users = await User.find(
        { id: { $in: ids } },
        { _id: 0, password: 0 }
    ).lean();

    return success.ok(users);
}

export async function importUser(params: {
    data: ImportUserReqBody;
    userRoles: string[];
    userId: string;
}): Promise<Result> {
    await validateImportData(params);
    const createUser = params.data.map(async (u) => {
        const id = v1();
        return {
            id: id,
            fullname: u.fullname,
            email: u.email,
            number: u.number,
            phone: u.phone,
            created_time: new Date(),
            created_by: params.userId,
            is_active: u.is_active,
            activities: [
                {
                    action: UserAction.CREATE,
                    actor: params.userId,
                    time: new Date(),
                },
            ],
        };
    });

    const users = await Promise.all([...createUser]);
    const accounts = params.data.map((u) => {
        const id = users.find((m) => m.email === u.email)?.id;
        return {
            id: id as string,
            email: u.email,
            password: u.password,
            is_active: true,
            roles: u.roles,
        };
    });
    const mails = params.data.map((u) => {
    });
    await Promise.all([createAccount(accounts), User.insertMany(users), mails]);
    return success.created({ inserted: params.data.length });
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

// check duplicate email
async function validateImportData(params: {
    data: ImportUserReqBody;
    userRoles: string[];
}): Promise<void> {
    const indexesEmailMissing: number[] = [];
    const indexesPasswordMissing: number[] = [];
    const emails = params.data.map((u) => u.email);
    params.data.forEach((u) => {
        if (!u.email || u.email === "") {
            indexesEmailMissing.push(u.index);
        }

        if (u.password === "") {
            indexesPasswordMissing.push(u.index);
        }
    });
    const users = await User.find({ email: { $in: emails } });
    const indexesEmailExisting = <number[]>params.data
        .map((e) => {
            const importUser = users.find((iu) => iu.email === e.email);
            return importUser ? e.index : null;
        })
        .filter((u) => u !== null);

    const errors: {
        indexes: number[];
        code: string;
        description: {
            vi: string;
            en: string;
        };
    }[] = [];
    if (indexesEmailMissing.length !== 0) {
        errors.push({
            indexes: indexesEmailMissing,
            code: "EMAIL_IS_NOT_VALID",
            description: {
                vi: "Địa chỉ email không hợp lệ",
                en: "Email address is not valid",
            },
        });
    }

    if (indexesEmailExisting.length !== 0) {
        errors.push({
            indexes: indexesEmailExisting,
            code: "REGISTERED_EMAIL",
            description: {
                vi: "Địa chỉ email đã được sử dụng",
                en: "The email is used for registration",
            },
        });
    }

    if (indexesPasswordMissing.length !== 0) {
        errors.push({
            indexes: indexesPasswordMissing,
            code: "PASSWORD_IS_NOT_VALID",
            description: {
                vi: "Mật khẩu không hợp lệ",
                en: "Password is not valid",
            },
        });
    }

    if (errors.length > 0) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            code: "INVALID_DATA",
            details: errors,
            description: {
                vi: "Tệp dữ liệu không hợp lệ",
                en: "File data is not valid",
            },
        });
    }
}

export async function getAllUserByPosition(params: {
    position: string;
    type?: boolean;
    semester?: string;
}): Promise<ResultSuccess> {
    const filter ={};
    const users = await User.find(filter, {
        _id: 0,
        id: 1,
        number: 1,
        fullname: 1,
        email: 1,
    }).then((res) => {
        const result = res.map(async (u) => {
            const research_area: {
                [key: string]: string | number | undefined;
            }[] = [];


            const data = {
                ...u.toObject(),
                research_area: research_area,
            };
            return data;
        });
        return Promise.all(result);
    });

    return success.ok(users);
}
