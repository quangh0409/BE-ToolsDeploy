export interface ITicket {
    id: string;
    github_id?: string;
    gitlab_id?: string;
    user_id: string;
    image_ids?: string[];
    record_ids?: string[];
}
