export interface IGIT {
    id: string;
    git_id: string,
    access_token: string;
    token_type: string;
    scope?: string;
    git_user: string;
}
