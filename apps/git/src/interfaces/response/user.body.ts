export interface ILoginRes {
    accessToken: string;
    refreshToken: string;
    roles: string[];
    activities: undefined;
    _id: undefined;
    id: string;
    fullname: string;
    email: string;
    is_active: boolean;
    avatar?: string | undefined;
    updated_time: Date;
    created_time: Date;
}
