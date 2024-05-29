import "dotenv/config";

export const configs = {
    service: "auth",
    environment: process.env.CA_SCAN_ENVIRONMENT || "dev",
    app: {
        prefix: "/api/v1",
        host: process.env.CA_SCAN_HOST_NAME || "0.0.0.0",
        port: process.env.CA_SCAN_PORT_NUMBER || "6805",
    },
    mongo: {
        addresses: process.env.CA_SCAN_MONGO_ADDRESSES || "rs0",
        username: process.env.CA_SCAN_MONGO_USERNAME || "root",
        password: process.env.CA_SCAN_MONGO_PASSWORD || "",
        dbName: process.env.CA_SCAN_MONGO_DB_NAME || "auth",
        templateUri:
            "mongodb://${addresses}/${dbName}" +
            "?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000" +
            "&directConnection=true",

        getUri: function (): string {
            let uri = this.templateUri;
            // const password = encodeURIComponent(this.password);
            // const username = encodeURIComponent(this.username);
            // uri = uri.replace("${username}", username);
            // uri = uri.replace("${password}", password);
            // uri = uri.replace("${authSource}", this.authSource);
            uri = uri.replace("${dbName}", this.dbName);
            uri = uri.replace("${addresses}", this.addresses);
            return uri;
        },
    },
    redis: {
        host: process.env.CA_SCAN_REDIS_HOST || "127.0.0.1",
        port: process.env.CA_SCAN_REDIS_PORT || "6380",
        username: process.env.CA_SCAN_REDIS_USERNAME || "",
        password: process.env.CA_SCAN_REDIS_PASSWORD || "",
    },
    keys: {
        secret: process.env.CA_SCAN_SECRET_KEY || "",
        public: process.env.CA_SCAN_PUBLIC_KEY || "",
        checkSecretKeyPublicKey: function (): void {
            if (!this.public) {
                throw new Error("Missing public key in environment variable");
            }
        },
    },
    log: {
        logFileEnabled: process.env.CA_SCAN_LOG_FILE_ENABLED || "false",
        folderLogsPath:
            process.env.CA_SCAN_FOLDER_LOGS_PATH || `${__dirname}/../../logs`,

        logstashEnabled: process.env.CA_SCAN_LOG_LOGSTASH_ENABLED || "false",
        logstashHost: process.env.CA_SCAN_LOG_LOGSTASH_HOST || "127.0.0.1",
        logstashPort: process.env.CA_SCAN_LOG_LOGSTASH_PORT || "50001",
        logstashProtocol: process.env.CA_SCAN_LOG_LOGSTASH_PROTOCOL || "udp",
    },
    saltRounds: process.env.CA_SCAN_SALT_ROUNDS || "10",
    services: {
        auth: {
            prefix:
                process.env.CA_SCAN_AUTH_SERVICE_PREFIX || "/api/v1/in/auth",
            host: process.env.CA_SCAN_AUTH_SERVICE_HOST || "http://127.0.0.1",
            port: process.env.CA_SCAN_AUTH_SERVICE_PORT || "6801",
            getUrl: function (): string {
                return `${this.host}:${this.port}${this.prefix}`;
            },
        },
        user: {
            prefix:
                process.env.CA_SCAN_USERS_SERVICE_PREFIX || "/api/v1/in/users",
            host: process.env.CA_SCAN_USERS_SERVICE_HOST || "http://127.0.0.1",
            port: process.env.CA_SCAN_USERS_SERVICE_PORT || "6801",
            getUrl: function (): string {
                return `${this.host}:${this.port}${this.prefix}`;
            },
        },
        ticket: {
            prefix:
                process.env.CA_SCAN_TICKET_SERVICE_PREFIX ||
                "/api/v1/in/ticket",
            host: process.env.CA_SCAN_TICKET_SERVICE_HOST || "http://127.0.0.1",
            port: process.env.CA_SCAN_TICKET_SERVICE_PORT || "6803",
            getUrl: function (): string {
                return `${this.host}:${this.port}${this.prefix}`;
            },
        },
    },
};

configs.keys.checkSecretKeyPublicKey();
