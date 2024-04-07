export interface IVms {
    id: string;
    host: string;
    user: string;
    pass: string;
    status: EStatus;
    last_connect: Date;
    services?: string[];
}
export enum EStatus {
    CONNECT = "CONNECTED",
    DISCONNECT = "DISCONNECTED",
}
