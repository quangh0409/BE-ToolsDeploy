import { error, HttpError, Result, ResultSuccess, success } from "app";
import mongoose, { FilterQuery } from "mongoose";
import { configs } from "../configs";
import { AccountReqBody } from "../interfaces/request";
import Account from "../models/account";
import bcrypt from "bcrypt";
import { redis } from "../database";
import { IAccount } from "../interfaces/models";
import { User } from "../models";

export async function createAccount(
    accounts: {
        id: string;
        email: string;
        password?: string;
        is_active: boolean;
        roles: string[];
    }[]
): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    type typeModel = Omit<AccountReqBody, "created_time"> & {
        created_time: Date;
    };
    const uniqueAccounts: typeModel[] = [];
    const sr = Number(configs.saltRounds);
    for (let i = 0; i < accounts.length; i++) {
        const element = accounts[i];
        let hashedPassword = undefined;
        if (element.password) {
            hashedPassword = await bcrypt.hash(
                element.password,
                await bcrypt.genSalt(sr)
            );
        }
        element.password = hashedPassword;
        uniqueAccounts.push({
            ...element,
            created_time: new Date(),
        });
    }
    const result = await Account.insertMany([...uniqueAccounts], { session });
    if (uniqueAccounts.length === result.length) {
        await session.commitTransaction();
        await session.endSession();
    } else {
        await session.abortTransaction();
        await session.endSession();
        const err = error.invalidData({
            location: "body",
            value: accounts,
            message: "some user ids already exists",
        });
        throw new HttpError(err);
    }
}

export async function updateAccountActivation(params: {
    ids: string[];
    status: boolean;
}): Promise<void> {
    const uniqueIds: string[] = [...new Set(params.ids)];
    const filter: FilterQuery<IAccount> = {
        id: { $in: uniqueIds },
    };

    const session = await mongoose.startSession();
    session.startTransaction();
    const updateResult = await Account.updateMany(
        filter,
        { $set: { is_active: params.status } },
        { new: true }
    );
    const keys = params.ids.map((id) => `ca:token:user:${id}`);
    const deletingKeys = keys.map((key) => redis.del(key));
    await Promise.all(deletingKeys);
    const matched = updateResult.matchedCount;
    if (matched === uniqueIds.length) {
        await session.commitTransaction();
        await session.endSession();
    } else {
        await session.abortTransaction();
        await session.endSession();
        const err = error.invalidData({
            location: "body",
            param: "ids",
            value: params.ids,
            message: "some account ids do not exist",
        });
        throw new HttpError(err);
    }
}

export async function getIdByEmail(email: string): Promise<Result> {
    const getId = await User.findOne({ email: email });
    if (!getId) {
        return error.invalidData({
            location: "body",
            param: "email",
            value: email,
            message: "the email is not correct",
            description: {
                vi: "Địa chỉ email không tồn tại trong hệ thông, vui lòng kiểm tra lại.",
                en: "The email address does not exist in the system, please check again.",
            },
        });
    }
    return success.ok({ id: getId.id });
}

export async function getRoleById(id: string): Promise<ResultSuccess> {
    const getId = await Account.findOne({ id: id });
    if (!getId) {
        throw error.invalidData({
            location: "body",
            param: "id",
            value: id,
            message: "the id is not correct",
            description: {
                vi: "id không tồn tại trong hệ thông, vui lòng kiểm tra lại.",
                en: "The ID does not exist in the system, please check again.",
            },
        });
    }
    return success.ok({ roles: getId.roles });
}
