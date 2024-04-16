export interface IRecord{
    id: string,
    status: string,
    step_logs: [],
    log_ssh: []
    created_time: Date
    commit_id: string,
    commit_message: string,
}

export interface ILog {
    log: string,
    title: string,
    sub_title: string,
    mess: string,
    status: "START",
}

export enum EStart {
    START = "START",
    DONE = "DONE"
}