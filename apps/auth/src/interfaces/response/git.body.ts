export interface IGIT {
    access_token: string;
    token_type: string;
    scope: string;
}

export interface ICreatedGithub {
    access_token: string;
    token_type: string;
    scope?: string;
    git_id: string;
    git_user: string;
}
