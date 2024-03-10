import logger from "logger";
import axios from "axios";
import { getCorrelationId } from "../hook";

export interface AppConfigurations {
    environment: string;
    service: string;
    log: {
        logFileEnabled?: string;
        folderLogsPath?: string;

        logstashEnabled?: string;
        logstashHost?: string;
        logstashPort?: string;
        logstashProtocol?: string;
    };
}

export function configLogger(configs: AppConfigurations): void {
    logger.config({ service: configs.service, ...configs.log });
}

export function configAxios(configs: AppConfigurations): void {
    const service = configs.service;
    axios.defaults.headers["x-forwarded-for"] = service;
    axios.interceptors.request.use((config) => {
        const correlationId = getCorrelationId();
        config.headers["x-correlation-id"] = correlationId;
        return config;
    });
}
