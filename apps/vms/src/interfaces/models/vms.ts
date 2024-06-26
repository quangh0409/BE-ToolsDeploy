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
    cpus: string;
    cores: string;
    sockets: string;
    ram: string;
    thread: string;
    standard: string;
    set_up: {
        docker: string;
        hadolint: string;
        trivy: string;
    };
}
export enum EStatus {
    CONNECT = "CONNECTED",
    DISCONNECT = "DISCONNECTED",
}
