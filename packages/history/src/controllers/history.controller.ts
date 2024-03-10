import { Kafka } from "kafkajs";
import "dotenv/config";
import logger from "logger";

export async function eventKafka(params: {
    event_data: object;
    topic: string;
    module: string;
    action: string;
    type: string;
    broker: string[];
    username: string;
    password: string;
}): Promise<void> {
    const dataValue = {
        metadata: params.event_data,
        module: params.module,
        action: params.action,
        type: params.type,
    };
    const kafka = new Kafka({
        brokers: params.broker as string[],
        ssl: false,
        sasl: {
            mechanism: "scram-sha-256", // scram-sha-256 or scram-sha-512
            username: params.username,
            password: params.password,
        },
    });
    const producer = kafka.producer();
    await producer.connect();
    try {
        await producer.send({
            topic: params.topic,
            messages: [
                {
                    value: JSON.stringify(dataValue),
                },
            ],
        });
    } catch (error) {
        logger.info("error %o", error);
    }
}
