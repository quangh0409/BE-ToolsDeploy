// export interface CreateUserReqBody {
//     email: string;
//     number: string;
//     fullname: string;
//     roles: string[];
//     phone?: string;
//     password: string;
//     position: EPOSITION;
//     is_active: boolean;
//     avatar?: string;
//     research_area: IResearchArea[];
// }

export interface FindUserReqBody {
    id: string;
    email: string;
    number: string;
    fullname?: string;
    phone?: string;
    position?: string;
    is_active: boolean;
    created_time: Date;
    updated_time: Date;
    last_time_ticket: Date;
}

export interface UserImport {
    index: number;
    email: string;
    password: string;
    number: string;
    fullname: string;
    phone?: string;
    roles: string[];
}
