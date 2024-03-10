export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DB_PORT: number;
            DB_USER: string;
            ENV: "test" | "dev" | "prod";
            CA_HISTORY_IP_KAFKA: string;
            CA_HISTORY_USER_KAFKA: string;
            CA_HISTORY_PASSWORD_KAFKA: string;
        }
    }
}
