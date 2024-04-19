import { HttpError, ResultSuccess, success, error } from "app";
import {
    IRecordReqBodyCreate,
    IRecordReqBodyUpdate,
} from "../interfaces/request/record.body";
import Record from "../models/record";
import { v1 } from "uuid";
import { UpdateQuery } from "mongoose";
import { EStatus, ILog, IOcean, IRecord } from "../interfaces/models";
import Service from "../models/service";

export async function createRecord(
    params: IRecordReqBodyCreate & {
        service: string;
        env: string;
    }
): Promise<ResultSuccess> {
    const service = await Service.findOne({ id: params.service });

    if (!service) {
        throw new HttpError(
            error.notFound({
                param: "service",
                value: params.service,
                message: "service not exit",
            })
        );
    }

    const record = new Record({
        id: v1(),
        status: params.status,
        ocean: params.ocean,
        logs: params.logs,
        commit_id: params.commit_id,
        commit_message: params.commit_message,
        created_time: new Date(),
        index: 1,
    });

    const index = service.environment.findIndex(
        (env) => env.name === params.env
    );

    if (index === -1) {
        throw new HttpError(
            error.notFound({
                param: "env",
                value: params.env,
                message: `service have not env(${params.env})`,
            })
        );
    }

    service.environment[index].record = [
        ...service.environment[index].record,
        record.id,
    ];

    await service.save();
    await record.save();

    return success.ok(record);
}

export async function updateRecord(params: {
    record: string;
    status?: EStatus;
    ocean?: IOcean;
    logs?: ILog;
}): Promise<ResultSuccess> {
    const record = await Record.findOne({ id: params.record });

    if (!record) {
        throw new HttpError(
            error.notFound({
                param: "id",
                value: params.record,
                message: "record not exit",
            })
        );
    }

    if (params.status) {
        record.status = params.status;
    }

    if (params.ocean) {
        record.ocean = params.ocean;
    }

    if (params.logs) {
        const keysParams = Object.keys(params.logs);

        keysParams.forEach((key) => {
            if (Object.keys(record.logs).includes(key) && params.logs) {
                record.logs[key] = [...record.logs[key], ...params.logs[key]];
            } else {
                if (params.logs) record.logs[key] = [...params.logs[key]];
            }
        });
    }

    await record.save();

    return success.ok(record);
}
