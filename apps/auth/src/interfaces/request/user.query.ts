export interface FindUserByEmailReqQuery {
    email: string;
}
export interface FindUserByIdAndTenantCodeReqQuery {
    userid: string;
}

export interface FindTotalUserReqQuery {
    roles: string;
    is_active: boolean;
}
