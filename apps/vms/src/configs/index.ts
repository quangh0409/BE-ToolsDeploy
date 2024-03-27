import "dotenv/config";

export const configs = {
    service: "vms",
    environment: process.env.CA_VMS_ENVIRONMENT || "dev",
    app: {
        prefix: "/api/v1",
        host: process.env.CA_VMS_HOST_NAME || "0.0.0.0",
        port: process.env.CA_VMS_PORT_NUMBER || "6804",
    },
    mongo: {
        addresses: process.env.CA_VMS_MONGO_ADDRESSES || "rs0",
        username: process.env.CA_VMS_MONGO_USERNAME || "root",
        password: process.env.CA_VMS_MONGO_PASSWORD || "",
        dbName: process.env.CA_VMS_MONGO_DB_NAME || "auth",
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
        host: process.env.CA_VMS_REDIS_HOST || "127.0.0.1",
        port: process.env.CA_VMS_REDIS_PORT || "6380",
        username: process.env.CA_VMS_REDIS_USERNAME || "",
        password: process.env.CA_VMS_REDIS_PASSWORD || "",
    },
    keys: {
        public: process.env.CA_VMS_PUBLIC_KEY || "",
        checkSecretKeyPublicKey: function (): void {
            if (!this.public) {
                throw new Error("Missing public key in environment variable");
            }
        },
    },
    log: {
        logFileEnabled: process.env.CA_VMS_LOG_FILE_ENABLED || "false",
        folderLogsPath:
            process.env.CA_VMS_FOLDER_LOGS_PATH || `${__dirname}/../../logs`,

        logstashEnabled: process.env.CA_VMS_LOG_LOGSTASH_ENABLED || "false",
        logstashHost: process.env.CA_VMS_LOG_LOGSTASH_HOST || "127.0.0.1",
        logstashPort: process.env.CA_VMS_LOG_LOGSTASH_PORT || "50001",
        logstashProtocol: process.env.CA_VMS_LOG_LOGSTASH_PROTOCOL || "udp",
    },
    saltRounds: process.env.CA_VMS_SALT_ROUNDS || "10",
    services: {
        // auth: {
        //     prefix: process.env.CA_VMS_AUTH_SERVICE_PREFIX || "/in/auth",
        //     host: process.env.CA_VMS_AUTH_SERVICE_HOST || "http://127.0.0.1",
        //     port: process.env.CA_VMS_AUTH_SERVICE_PORT || "6801",
        //     getUrl: function (): string {
        //         return `${this.host}:${this.port}${this.prefix}`;
        //     },
        // },
        ticket: {
            prefix:
                process.env.CA_GIT_TICKET_SERVICE_PREFIX || "/api/v1/in/ticket",
            host: process.env.CA_GIT_TICKET_SERVICE_HOST || "http://127.0.0.1",
            port: process.env.CA_GIT_TICKET_SERVICE_PORT || "6803",
            getUrl: function (): string {
                return `${this.host}:${this.port}${this.prefix}`;
            },
        },
    },
};

configs.keys.checkSecretKeyPublicKey();
