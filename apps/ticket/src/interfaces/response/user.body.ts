export interface IUser {
    id: string;
    fullname: string;
    email: string;
    is_active: boolean;
    avatar?: string;
    updated_time: Date;
    created_time: Date;
    activities: IUserActivity[];
}

export interface IUserActivity {
    actor: string;
    action: string;
    time: Date;
    note?: string;
}
