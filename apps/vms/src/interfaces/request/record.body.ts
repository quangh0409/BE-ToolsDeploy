import { EStatus, ILog, IOcean } from "../models";

export interface IRecordReqBodyCreate {
    status: EStatus;
    ocean: IOcean;
    logs: ILog;
    created_time: Date;
    commit_id: string;
    commit_message: string;
}

export interface IRecordReqBodyUpdate{
    status?: EStatus;
    ocean?: IOcean[];
    logs: ILog;
}
