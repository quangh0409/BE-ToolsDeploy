export enum UserAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    RESET_PASSWORD = "RESET_PASSWORD",
    UPDATE_PASSWORD = "UPDATE_PASSWORD",
}

export interface IUserActivity {
    actor: string;
    action: string;
    time: Date;
    note?: string;
}

export interface IGithub {

}

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


