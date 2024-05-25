export interface SendMailBody {
    code: string;
    service_name: string;
    email: string[];
    action_by: string;
    info: {
        IDTicket?: string;
        RequesterName?: string;
        Subject?: string;
        TicketLink?: string;
        GroupName?: string;
        Assignee?: string;
        Solution?: string;
        Tech?: string;
    };
}

export interface SendMailResetPassReqBody {
    password: string;
    username: string;
    email: string;
}
