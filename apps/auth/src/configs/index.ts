import "dotenv/config";

export const configs = {
    service: "auth",
    environment: process.env.CA_AUTH_ENVIRONMENT || "dev",
    kafka: {
        broker: process.env.CA_AUTH_BROKER_KAFKA,
        username: process.env.CA_AUTH_USERNAME_KAFKA,
        password: process.env.CA_AUTH_PASSWORD_KAFKA,
    },
    app: {
        prefix: "/api/v1",
        host: process.env.CA_AUTH_HOST_NAME || "0.0.0.0",
        port: process.env.CA_AUTH_PORT_NUMBER || "6801",
    },
    mongo: {
        addresses: process.env.CA_AUTH_MONGO_ADDRESSES || "127.0.0.1:27017",
        // username: process.env.CA_AUTH_MONGO_USERNAME || "root",
        // password: process.env.CA_AUTH_MONGO_PASSWORD || "",
        // authSource: process.env.CA_AUTH_MONGO_AUTHOR_SOURCE || "admin",
        dbName: process.env.CA_AUTH_MONGO_DB_NAME || "auth",
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
        host: process.env.CA_AUTH_REDIS_HOST || "127.0.0.1",
        port: process.env.CA_AUTH_REDIS_PORT || "6380",
        username: process.env.CA_AUTH_REDIS_USERNAME || "",
        password: process.env.CA_AUTH_REDIS_PASSWORD || "",
    },
    keys: {
        secret: process.env.CA_AUTH_SECRET_KEY || "",
        public: process.env.CA_AUTH_PUBLIC_KEY || "",
        checkSecretKeyPublicKey: function (): void {
            if (!this.secret) {
                throw new Error("Missing secret key in environment variable");
            }
            if (!this.public) {
                throw new Error("Missing public key in environment variable");
            }
        },
    },
    log: {
        logFileEnabled: process.env.CA_AUTH_LOG_FILE_ENABLED || "false",
        folderLogsPath:
            process.env.CA_AUTH_FOLDER_LOGS_PATH || `${__dirname}/../../logs`,

        logstashEnabled: process.env.CA_AUTH_LOG_LOGSTASH_ENABLED || "false",
        logstashHost: process.env.CA_AUTH_LOG_LOGSTASH_HOST || "127.0.0.1",
        logstashPort: process.env.CA_AUTH_LOG_LOGSTASH_PORT || "50001",
        logstashProtocol: process.env.CA_AUTH_LOG_LOGSTASH_PROTOCOL || "udp",
    },
    saltRounds: process.env.CA_AUTH_SALT_ROUNDS || "10",
    services: {
        ad: {
            prefix: process.env.CA_AUTH_AD_SERVICE_PREFIX || "/",
            host: process.env.CA_AUTH_AD_SERVICE_HOST || "http://127.0.0.1",
            port: process.env.CA_AUTH_AD_SERVICE_PORT || "6801",
            getUrl: function (): string {
                return `${this.host}:${this.port}${this.prefix}`;
            },
        },
        git: {
            prefix: process.env.CA_AUTH_GIT_SERVICE_PREFIX || "/api/v1/in/git",
            host: process.env.CA_AUTH_GIT_SERVICE_HOST || "http://127.0.0.1",
            port: process.env.CA_AUTH_GIT_SERVICE_PORT || "6802",
            getUrl: function (): string {
                return `${this.host}:${this.port}${this.prefix}`;
            },
        },
        ticket: {
            prefix:
                process.env.CA_AUTH_TICKET_SERVICE_PREFIX ||
                "/api/v1/in/ticket",
            host: process.env.CA_AUTH_TICKET_SERVICE_HOST || "http://127.0.0.1",
            port: process.env.CA_AUTH_TICKET_SERVICE_PORT || "6803",
            getUrl: function (): string {
                return `${this.host}:${this.port}${this.prefix}`;
            },
        },
        mail: {
            prefix:
                process.env.CA_AUTH_MAIL_SERVICE_PREFIX || "/api/v1/in/mail",
            host: process.env.CA_AUTH_MAIL_SERVICE_HOST || "http://127.0.0.1",
            port: process.env.CA_AUTH_MAIL_SERVICE_PORT || "6806",
            getUrl: function (): string {
                return `${this.host}:${this.port}${this.prefix}`;
            },
        },
        // file: {
        //     prefix:
        //         process.env.CA_AUTH_FILE_SERVICE_PREFIX || "/api/v1/in/files",
        //     host: process.env.CA_AUTH_FILE_SERVICE_HOST || "http://127.0.0.1",
        //     port: process.env.CA_AUTH_FILE_SERVICE_PORT || "6802",
        //     getUrl: function (): string {
        //         return `${this.host}:${this.port}${this.prefix}`;
        //     },
        // },
    },
};

configs.keys.checkSecretKeyPublicKey();
