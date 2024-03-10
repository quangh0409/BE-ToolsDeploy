export {};

export interface Payload {
    id: string;
    roles: string[];
    email: string;
    type: string;
}

declare global {
    // eslint-disable-next-line
    namespace Express {
        export interface Request {
            payload?: Payload;
            request_id: string;
            correlation_id?: string;
        }
    }
}
