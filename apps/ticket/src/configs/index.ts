import "dotenv/config";

export const configs = {
    service: "ticket",
    environment: process.env.CA_TICKET_ENVIRONMENT || "dev",
    app: {
        prefix: "/api/v1",
        host: process.env.CA_TICKET_HOST_NAME || "0.0.0.0",
        port: process.env.CA_TICKET_PORT_NUMBER || "6803",
    },
    mongo: {
        addresses: process.env.CA_TICKET_MONGO_ADDRESSES || "rs0",
        username: process.env.CA_TICKET_MONGO_USERNAME || "root",
        password: process.env.CA_TICKET_MONGO_PASSWORD || "",
        dbName: process.env.CA_TICKET_MONGO_DB_NAME || "auth",
        templateUri:
            "mongodb+srv://${username}:${password}@${addresses}/${dbName}",
        getUri: function (): string {
            let uri = this.templateUri;
            const password = encodeURIComponent(this.password);
            const username = encodeURIComponent(this.username);
            uri = uri.replace("${username}", username);
            uri = uri.replace("${password}", password);
            uri = uri.replace("${dbName}", this.dbName);
            uri = uri.replace("${addresses}", this.addresses);
            return uri;
        },
    },
    redis: {
        host: process.env.CA_TICKET_REDIS_HOST || "127.0.0.1",
        port: process.env.CA_TICKET_REDIS_PORT || "6380",
        username: process.env.CA_TICKET_REDIS_USERNAME || "",
        password: process.env.CA_TICKET_REDIS_PASSWORD || "",
    },
    keys: {
        public: process.env.CA_TICKET_PUBLIC_KEY || "",
        checkSecretKeyPublicKey: function (): void {
            if (!this.public) {
                throw new Error("Missing public key in environment variable");
            }
        },
    },
    log: {
        logFileEnabled: process.env.CA_TICKET_LOG_FILE_ENABLED || "false",
        folderLogsPath:
            process.env.CA_TICKET_FOLDER_LOGS_PATH || `${__dirname}/../../logs`,

        logstashEnabled: process.env.CA_TICKET_LOG_LOGSTASH_ENABLED || "false",
        logstashHost: process.env.CA_TICKET_LOG_LOGSTASH_HOST || "127.0.0.1",
        logstashPort: process.env.CA_TICKET_LOG_LOGSTASH_PORT || "50001",
        logstashProtocol: process.env.CA_TICKET_LOG_LOGSTASH_PROTOCOL || "udp",
    },
    saltRounds: process.env.CA_TICKET_SALT_ROUNDS || "10",
    services: {
        ad: {
            prefix: process.env.CA_TICKET_AD_SERVICE_PREFIX || "/",
            host: process.env.CA_TICKET_AD_SERVICE_HOST || "http://127.0.0.1",
            port: process.env.CA_TICKET_AD_SERVICE_PORT || "6801",
            getUrl: function (): string {
                return `${this.host}:${this.port}${this.prefix}`;
            },
        },
    },
};

configs.keys.checkSecretKeyPublicKey();
