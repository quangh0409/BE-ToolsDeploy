import mongoose, { Document } from "mongoose";
export interface IRecord {
    id: string;
    status: EStatus;
    ocean: IOcean;
    logs: ILog;
    created_time: Date;
    commit_id: string;
    commit_message: string;
    index: number;
    branch: string;
    end_time: Date;
}

export interface IOceanContent {
    title: string;
    status: EStatus;
    time?: string;
}

export interface IOcean {
    [key: string]: IOceanContent;
}

export interface ILog {
    [key: string]: ILogContent[];
}

export interface ILogContent {
    log?: string[];
    title: string;
    sub_title: string;
    mess?: string;
    status: EStatus;
}

export interface ILogCommand {
    stdout?: string;
    stderr?: string;
    code?: number | null;
    signal?: string | null;
}

export enum EStatus {
    START = "START",
    DONE = "DONE",
    IN_PROGRESS = "IN_PROGRESS",
    SUCCESSFULLY = "SUCCESSFULLY",
    ERROR = "ERROR",
}
