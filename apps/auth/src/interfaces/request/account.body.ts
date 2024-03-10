export interface AccountReqBody {
    id: string;
    email: string;
    password?: string;
    is_active: boolean;
    roles: string[];
}
