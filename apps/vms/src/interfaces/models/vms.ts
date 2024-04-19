export interface IVms {
    id: string;
    host: string;
    user: string;
    pass: string;
    status: EStatus;
    last_connect: Date;
    services?: string[];
    operating_system: string;
    kernel: string;
    architecture: string;
    home_url: string;
    support_url: string;
    bug_report_url: string;
    privacy_policy_url: string;
}
export enum EStatus {
    CONNECT = "CONNECTED",
    DISCONNECT = "DISCONNECTED",
}
