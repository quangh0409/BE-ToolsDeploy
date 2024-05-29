export interface ITicket {
    id: string;
    github_id?: string;
    gitlab_id?: string;
    user_id: string;
    vms_ids?: string[];
    record_ids?: string[];
    standard_ids?: string[];
}

export interface IDelete {
    isDelete: boolean;
}
