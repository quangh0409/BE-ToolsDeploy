export interface ICreateUser {
    email: string;
    password: string;
    fullname: string;
    roles: string[];
    avatar?: string;
}
