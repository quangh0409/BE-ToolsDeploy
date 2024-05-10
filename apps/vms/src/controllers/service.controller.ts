import { Socket } from "socket.io";
import { verifyToken } from "./vms.controller";
import { findTicketByUserId } from "../services/ticket.service";
import { NodeSSH } from "node-ssh";
import logger from "logger";
import Vms from "../models/vms";
import { IServiceBody } from "../interfaces/request/service.body";
import {
    HttpError,
    HttpStatus,
    ResultError,
    ResultSuccess,
    success,
    error,
} from "app";
import Service from "../models/service";
import { v1 } from "uuid";
import Record from "../models/record";
import { EStatus, ILogCommand } from "../interfaces/models";
import { time } from "console";
import { GetLastCommitByAccessToken } from "../services/git.service";
import { SocketServer } from "../utils";

export async function createService(
    params: IServiceBody
): Promise<ResultSuccess> {
    const service = new Service({
        id: v1(),
        name: params.name,
        architectura: params.architectura,
        language: params.language,
        repo: params.repo,
        source: params.source,
        user: params.user,
        environment: [...params.environments],
    });

    const vms_ids = params.environments.map((env) => {
        return env.vm;
    });

    await Vms.updateMany(
        {
            id: {
                $in: vms_ids,
            },
        },
        {
            $push: {
                services: service.id,
            },
        }
    );

    await service.save();
    return success.ok(service);
}

export async function updateService(
    params: IServiceBody & {
        id: string;
    }
): Promise<ResultSuccess> {
    const service = await Service.findOneAndUpdate(
        {
            id: v1(),
        },
        {
            name: params.name,
            architectura: params.architectura,
            language: params.language,
            repo: params.repo,
            source: params.source,
            user: params.user,
            environment: [...params.environments],
        }
    );

    const vms_ids = params.environments.map((env) => {
        return env.vm;
    });

    if (!service) {
        throw new HttpError(
            error.notFound({
                location: "params",
                param: "service",
                message: `service not exit`,
                value: params.id,
            })
        );
    }

    await Vms.updateMany(
        {
            id: {
                $in: vms_ids,
            },
        },
        {
            $push: {
                services: service.id,
            },
        }
    );

    await service.save();
    return success.ok(service);
}

export async function deleteService(params: {
    id: string;
    vm: string;
}): Promise<ResultSuccess> {
    const vm = await Vms.findOne({ id: params.vm });

    if (!vm) {
        throw new HttpError(
            error.notFound({
                message: `vm not exit`,
                value: params.vm,
            })
        );
    }

    const check = await Service.deleteOne({ id: params.id });
    if (check.deletedCount !== 1) {
        throw new HttpError(
            error.notFound({
                message: `service not exited, failed delete`,
                value: params.id,
            })
        );
    }

    const services = vm.services?.filter((service) => service != params.id);
    console.log("🚀 ~ services:", services);

    vm.services = services;
    await vm.save();

    return success.ok({ message: "successfully deleted" });
}

export async function getAllService(params: {
    vm: string;
}): Promise<ResultSuccess> {
    const vm = await Vms.findOne({ id: params.vm });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "body",
                value: params.vm,
                message: "Host not exit",
            },
        ],
    };
    if (!vm) {
        throw new HttpError(err);
    }

    const services = await Service.find(
        {
            id: {
                $in: vm.services,
            },
        },
        {
            _id: 0,
        }
    );

    return success.ok(services);
}

export async function getServiceById(params: {
    id: string;
}): Promise<ResultSuccess> {
    const service = await Service.findOne({ id: params.id }, { _id: 0 });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "body",
                value: params.id,
                message: "Service not exit",
            },
        ],
    };
    if (!service) {
        throw new HttpError(err);
    }
    const result = service.toJSON();
    const envs = [];
    for (const e of result.environment) {
        const vm = await Vms.findOne({ id: e.vm });
        const temp = Object.assign({}, e, {
            vm: {
                id: vm?.id,
                host: vm?.host,
            },
        });
        envs.push(temp);
    }

    Object.assign(result, { environment: envs });
    return success.ok(result);
}

export async function findServiceInVmsByName(params: {
    vm: string;
    service: string;
}): Promise<ResultSuccess> {
    const vm = await Vms.findOne({ id: params.vm });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "body",
                value: params.vm,
                message: "Host not exit",
            },
        ],
    };
    if (!vm) {
        throw new HttpError(err);
    }

    const services = await Service.find(
        {
            id: {
                $in: vm.services,
            },
            name: {
                $regex: `${params.service}`,
                $options: "i",
            },
        },
        {
            _id: 0,
        }
    );

    return success.ok(services);
}

export async function UpdateStatusServiceById(params: {
    id: string;
    status: string;
    env: string;
}) {
    const service = await Service.findOne({ id: params.id });

    if (!service) {
        throw new HttpError(
            error.notFound({
                param: "id",
                value: params.id,
                message: "service not exit",
            })
        );
    }

    const idx = service.environment.findIndex((e) => e.name === params.env);

    service.environment[idx].status = params.status;

    await service.save();

    return success.ok({ ...service, _id: undefined });
}

export async function getImagesOfServiceById(params: {
    service: string;
    env: string;
}): Promise<ResultSuccess> {
    const service = await Service.findOne({ id: params.service });
    const ssh = new NodeSSH();

    if (service) {
        const env = service.environment.find((e) => e.name === params.env);

        const vm = await Vms.findOne({
            id: env!.vm,
        });

        await ssh.connect({
            host: vm!.host,
            username: vm!.user,
            password: vm!.pass,
        });

        const log = await ssh.execCommand(`docker images --format json`);
        const images_ = log.stdout.split("\n").map((item) => JSON.parse(item));

        const imageRegex = /image:\s*docker.io\/(.*)/g;
        let match: RegExpExecArray | null;
        const images: string[] = [];

        while (
            (match = imageRegex.exec(env!.docker_compose[0].content)) !== null
        ) {
            images.push(match[1]);
        }

        let result = images_.filter((element) =>
            images.includes(element.Repository)
        );

        return success.ok({ result });
    }

    throw new HttpError(
        error.notFound({
            param: "service",
            value: params.service,
            message: "service not exit",
        })
    );
}

export async function scanImageOfService(params: {
    service: string;
    env: string;
    image: string;
}): Promise<ResultSuccess> {
    const service = await Service.findOne({ id: params.service });
    const ssh = new NodeSSH();

    if (service) {
        const env = service.environment.find((e) => e.name === params.env);

        const vm = await Vms.findOne({
            id: env!.vm,
        });

        await ssh.connect({
            host: vm!.host,
            username: vm!.user,
            password: vm!.pass,
        });

        const log = await ssh.execCommand(
            `trivy image ${params.image} --format json --scanners vuln`
        );

        return success.ok(JSON.parse(log.stdout));
    }

    throw new HttpError(
        error.notFound({
            param: "service",
            value: params.service,
            message: "service not exit",
        })
    );
}

export async function logOfDockerCompose(
    service: string,
    env: string,
    socket: Socket
): Promise<boolean> {
    const ser = await Service.findOne({ id: service });
    const ssh = new NodeSSH();

    if (ser) {
        const environment = ser.environment.find((e) => e.name === env);

        const vm = await Vms.findOne({
            id: environment!.vm,
        });

        await ssh.connect({
            host: vm!.host,
            username: vm!.user,
            password: vm!.pass,
        });

        ssh.execCommand(
            "cd BE-ToolsDeploy && docker-compose logs -f --no-color",
            {
                onStdout(chunk) {
                    // Gửi log mới đến client
                    // console.log(chunk.toString("utf8"));
                    chunk
                        .toString("utf8")
                        .split("\n")
                        .map((l) => {
                            socket.emit("docker-compose-logs", l);
                        });
                },
            }
        );

        return true;
    }

    throw new HttpError(
        error.notFound({
            param: "service",
            value: service,
            message: "service not exit",
        })
    );
}

export async function planCiCd(
    socket: Socket,
    token: string,
    vm_id: string,
    service_id: string,
    env_name: string
): Promise<Boolean> {
    const payload = await verifyToken(token);
    const ticket = await findTicketByUserId({ user_id: payload.id });

    if (ticket.body && ticket.status === 200) {
        if (ticket.body.vms_ids) {
            const check = ticket.body.vms_ids.find((id) => {
                return vm_id === id;
            });
            if (check) {
                const ssh = new NodeSSH();

                const vm = await Vms.findOne({
                    id: vm_id,
                });

                if (!vm) {
                    socket.emit(`logPlanCiCd-${payload.id}`, {
                        log: undefined,
                        title: "vm",
                        sub_title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                    return false;
                }

                // TODO xu ly service de laays tham soos
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit(`logPlanCiCd-${payload.id}`, {
                        log: undefined,
                        title: "service",
                        sub_title: undefined,
                        mess: "SERVICE NOT EXITED",
                        status: "ERROR",
                    });
                    return false;
                }

                const repo = service!.repo;

                const env = service!.environment.find((e) => {
                    return e.name === env_name;
                });
                const env_index: number = service!.environment.findIndex(
                    (e) => {
                        return e.name === env_name;
                    }
                );

                const commit = await GetLastCommitByAccessToken({
                    userId: payload.id,
                    repository: repo,
                    branch: env!.branch,
                });

                const record = new Record({
                    id: v1(),
                    status: EStatus.START,
                    index: service.environment[env_index].record.length + 1,
                    logs: {},
                    ocean: {},
                    created_time: new Date(),
                    branch: env!.branch,
                    commit_id: commit.body!.commit_id,
                    commit_message: commit.body!.commit_message,
                    commit_html_url: commit.body!.url,
                });
                /** handle stage ssh  */
                let start_time = new Date();

                try {
                    record.logs["ssh"] = [
                        {
                            log: undefined,
                            title: "ssh",
                            sub_title: "ssh connect",
                            mess: "CONNECT",
                            status: EStatus.START,
                            start_time: start_time,
                        },
                    ];
                    record.ocean["ssh"] = {
                        title: "ssh",
                        status: EStatus.START,
                    };
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });
                    record.ocean["ssh"] = {
                        title: "ssh",
                        status: EStatus.DONE,
                    };
                    record.logs["ssh"] = [
                        {
                            log: undefined,
                            title: "ssh",
                            sub_title: "ssh connect successfully",
                            mess: "CONNECT SUCCESSFULLY",
                            status: EStatus.DONE,
                            start_time: start_time,
                            end_time: new Date(),
                        },
                    ];

                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                } catch (err: any) {
                    console.log("🚀 ~ err:", err);
                    record.ocean["ssh"] = {
                        title: "ssh",
                        status: EStatus.ERROR,
                    };
                    record.logs["ssh"] = [
                        {
                            log: undefined,
                            title: "ssh",
                            sub_title: "ssh connect failed",
                            mess: JSON.stringify(err),
                            start_time: start_time,
                            status: EStatus.ERROR,
                            end_time: new Date(),
                        },
                    ];
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    service.environment[env_index].record.push(record.id);
                    record.end_time = new Date();
                    record.status = EStatus.ERROR;
                    await record.save();
                    await service.save();
                    return false;
                }

                let log;
                let command;
                /** handle stage clone  */

                if (record.ocean["ssh"].status === EStatus.DONE) {
                    record.ocean["clone"] = {
                        title: "clone",
                        status: EStatus.START,
                    };
                    record.logs["clone"] = [];
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    command = `git clone ${
                        service!.source
                    } 2> /dev/null || (rm -rf ${service!.repo} ; git clone ${
                        service!.source
                    })`;
                    start_time = new Date();
                    log = await ssh.execCommand(command);
                    if (log.code === 0) {
                        record.ocean["clone"] = {
                            title: "clone",
                            status: EStatus.IN_PROGRESS,
                        };
                        record.logs["clone"].push({
                            log: [log.stdout],
                            title: "clone",
                            sub_title: command,
                            mess: undefined,
                            status: EStatus.SUCCESSFULLY,
                            start_time: start_time,
                            end_time: new Date(),
                        });
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                        command = `cd ${service!.repo} && git checkout ${
                            env!.branch
                        }`;
                        start_time = new Date();
                        log = await ssh.execCommand(command);
                    }
                    if (log.code === 0) {
                        record.logs["clone"].push({
                            log: [log.stdout],
                            title: "clone",
                            sub_title: command,
                            mess: undefined,
                            status: EStatus.SUCCESSFULLY,
                            start_time: start_time,
                            end_time: new Date(),
                        });
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );

                        for (const docker_file of env!.docker_file) {
                            start_time = new Date();
                            command = `cat > ${service.repo}/${docker_file.location}`;
                            log = await ssh.execCommand(command, {
                                stdin: docker_file.content,
                            });
                            if (log.code !== 0) {
                                record.ocean["clone"] = {
                                    title: "clone",
                                    status: EStatus.ERROR,
                                };
                                record.logs["clone"].push({
                                    log: [log.stdout],
                                    title: "clone",
                                    sub_title: `${command}`,
                                    mess: undefined,
                                    status: EStatus.ERROR,
                                    start_time: start_time,
                                    end_time: new Date(),
                                });
                                SocketServer.getInstance().io.emit(
                                    `logPlanCiCd-${payload.id}`,
                                    record
                                );
                                service.environment[env_index].record.push(
                                    record.id
                                );
                                record.end_time = new Date();
                                record.status = EStatus.ERROR;
                                await record.save();
                                await service.save();
                                return false;
                            }
                            record.logs["clone"].push({
                                log: [log.stdout],
                                title: "clone",
                                sub_title: `${command}`,
                                mess: undefined,
                                status: EStatus.SUCCESSFULLY,
                                start_time: start_time,
                                end_time: new Date(),
                            });
                            SocketServer.getInstance().io.emit(
                                `logPlanCiCd-${payload.id}`,
                                record
                            );
                        }
                    }
                    if (log.code === 0) {
                        record.ocean["clone"] = {
                            title: "clone",
                            status: EStatus.SUCCESSFULLY,
                        };
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                    }

                    if (log.code !== 0) {
                        record.ocean["clone"] = {
                            title: "clone",
                            status: EStatus.ERROR,
                        };
                        record.logs["clone"].push({
                            log: [log.stdout],
                            title: "clone",
                            sub_title: `${command}`,
                            mess: undefined,
                            status: EStatus.ERROR,
                            start_time: start_time,
                            end_time: new Date(),
                        });
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                        service.environment[env_index].record.push(record.id);
                        record.end_time = new Date();
                        record.status = EStatus.ERROR;
                        await record.save();
                        await service.save();
                        return false;
                    }
                }
                /** handle stage scanSyntax  */
                if (record.ocean["clone"].status === EStatus.SUCCESSFULLY) {
                    record.ocean["scanSyntax"] = {
                        title: "scanSyntax",
                        status: EStatus.START,
                    };
                    record.logs["scanSyntax"] = [];
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    record.ocean["scanSyntax"] = {
                        title: "scanSyntax",
                        status: EStatus.IN_PROGRESS,
                    };
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    if (env?.docker_file && env.docker_file.length > 0) {
                        for (const docker_file of env.docker_file) {
                            start_time = new Date();
                            // command = `cd  ${service.repo} /${docker_file.location}`;
                            command =
                                "cd " +
                                service.repo +
                                " && hadolint " +
                                docker_file.location +
                                " --no-fail --format json";
                            log = await ssh.execCommand(command);
                            if (log.code !== 0) {
                                record.ocean["scanSyntax"] = {
                                    title: "scanSyntax",
                                    status: EStatus.ERROR,
                                };
                                record.logs["scanSyntax"].push({
                                    log: [log.stdout],
                                    title: "scanSyntax",
                                    sub_title: `${command}`,
                                    mess: undefined,
                                    status: EStatus.ERROR,
                                    start_time: start_time,
                                    end_time: new Date(),
                                });
                                SocketServer.getInstance().io.emit(
                                    `logPlanCiCd-${payload.id}`,
                                    record
                                );
                                service.environment[env_index].record.push(
                                    record.id
                                );
                                record.end_time = new Date();
                                record.status = EStatus.ERROR;
                                await record.save();
                                await service.save();
                                return false;
                            }
                            record.logs["scanSyntax"].push({
                                log: [log.stdout],
                                title: "scanSyntax",
                                sub_title: `${command}`,
                                mess: undefined,
                                status: EStatus.SUCCESSFULLY,
                                start_time: start_time,
                                end_time: new Date(),
                            });
                            SocketServer.getInstance().io.emit(
                                `logPlanCiCd-${payload.id}`,
                                record
                            );
                        }
                    }
                    if (env?.docker_compose && env.docker_compose.length > 0) {
                        for (const docker_compose of env.docker_compose) {
                            // command = `cd  ${service.repo} /${docker_file.location}`;
                            start_time = new Date();
                            command =
                                "cd " +
                                service.repo +
                                " && hadolint " +
                                docker_compose.location +
                                " --no-fail";
                            log = await ssh.execCommand(command);
                            if (log.code !== 0) {
                                record.ocean["scanSyntax"] = {
                                    title: "scanSyntax",
                                    status: EStatus.ERROR,
                                };
                                record.logs["scanSyntax"].push({
                                    log: [""],
                                    title: "scanSyntax",
                                    sub_title: `${command}`,
                                    mess: undefined,
                                    status: EStatus.ERROR,
                                    start_time: start_time,
                                    end_time: new Date(),
                                });
                                SocketServer.getInstance().io.emit(
                                    `logPlanCiCd-${payload.id}`,
                                    record
                                );
                                service.environment[env_index].record.push(
                                    record.id
                                );
                                record.end_time = new Date();
                                record.status = EStatus.ERROR;
                                await record.save();
                                await service.save();
                                return false;
                            }
                            record.logs["scanSyntax"].push({
                                log: [log.stdout],
                                title: "scanSyntax",
                                sub_title: `${command}`,
                                mess: undefined,
                                status: EStatus.SUCCESSFULLY,
                                start_time: start_time,
                                end_time: new Date(),
                            });
                            SocketServer.getInstance().io.emit(
                                `logPlanCiCd-${payload.id}`,
                                record
                            );
                        }
                    }
                    if (log && log.code === 0) {
                        record.ocean["scanSyntax"] = {
                            title: "scanSyntax",
                            status: EStatus.SUCCESSFULLY,
                        };
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                    }

                    if (log && log.code !== 0) {
                        record.ocean["scanSyntax"] = {
                            title: "scanSyntax",
                            status: EStatus.ERROR,
                        };
                        record.logs["scanSyntax"].push({
                            log: [log.stdout],
                            title: "scanSyntax",
                            sub_title: `${command}`,
                            mess: undefined,
                            status: EStatus.ERROR,
                            start_time: start_time,
                            end_time: new Date(),
                        });
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                        service.environment[env_index].record.push(record.id);
                        record.end_time = new Date();
                        record.status = EStatus.ERROR;
                        await record.save();
                        await service.save();
                        return false;
                    }
                }
                /** handle stage clear  */
                if (
                    record.ocean["scanSyntax"].status === EStatus.SUCCESSFULLY
                ) {
                    record.ocean["clear"] = {
                        title: "clear",
                        status: EStatus.START,
                    };
                    record.logs["clear"] = [];
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    record.ocean["clear"] = {
                        title: "clear",
                        status: EStatus.IN_PROGRESS,
                    };
                    start_time = new Date();
                    command = `cd ${service.repo} && docker-compose down && docker builder prune -f`;
                    record.logs["clear"].push({
                        log: [],
                        title: "clear",
                        // sub_title: `docker stop $(docker ps -aq) || echo no container && docker rmi -f $(docker images -q) || echo no image && docker builder prune -f`,
                        sub_title: command,
                        mess: undefined,
                        status: EStatus.IN_PROGRESS,
                        start_time: new Date(),
                    });
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    log = await ssh.execCommand(
                        command,

                        {
                            onStdout(chunk) {
                                // Gửi log mới đến client
                                // console.log(chunk.toString("utf8"));
                                chunk
                                    .toString("utf8")
                                    .split("\n")
                                    .map((l) => {
                                        record.logs["clear"][0].log?.push(l);
                                        SocketServer.getInstance().io.emit(
                                            `logPlanCiCd-${payload.id}`,
                                            record
                                        );
                                    });
                            },
                        }
                    );
                    if (log.code === 0) {
                        record.ocean["clear"] = {
                            title: "clear",
                            status: EStatus.SUCCESSFULLY,
                        };
                        record.logs["clear"][0].end_time = new Date();
                        record.logs["clear"][0].status = EStatus.SUCCESSFULLY;
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                    }
                    if (log.code !== 0) {
                        record.ocean["clear"] = {
                            title: "clear",
                            status: EStatus.ERROR,
                        };
                        record.logs["clear"][0].end_time = new Date();
                        record.logs["clear"][0].status = EStatus.ERROR;
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                        service.environment[env_index].record.push(record.id);
                        record.end_time = new Date();
                        record.status = EStatus.ERROR;
                        await record.save();
                        await service.save();
                        return false;
                    }
                }
                /** handle stage build  */
                if (record.ocean["clear"].status === EStatus.SUCCESSFULLY) {
                    record.ocean["build"] = {
                        title: "build",
                        status: EStatus.START,
                    };
                    record.logs["build"] = [];
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    record.ocean["build"] = {
                        title: "build",
                        status: EStatus.IN_PROGRESS,
                    };
                    start_time = new Date();
                    command = `whoami && cd ${
                        service!.repo
                    } && docker-compose build`;
                    // command = `whoami`;
                    record.logs["build"].push({
                        log: [],
                        title: "build",
                        sub_title: command,
                        mess: undefined,
                        status: EStatus.IN_PROGRESS,
                        start_time: start_time,
                    });
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    log = await ssh.execCommand(command, {
                        onStdout(chunk) {
                            // Gửi log mới đến client
                            // console.log(chunk.toString("utf8"));
                            chunk
                                .toString("utf8")
                                .split("\n")
                                .map((l) => {
                                    record.logs["build"][0].log?.push(l);
                                    SocketServer.getInstance().io.emit(
                                        `logPlanCiCd-${payload.id}`,
                                        record
                                    );
                                });
                        },
                        onStderr(chunk) {
                            // Gửi log mới đến client
                            // console.log(chunk.toString("utf8"));
                            chunk
                                .toString("utf8")
                                .split("\n")
                                .map((l) => {
                                    record.logs["build"][0].log?.push(l);
                                    SocketServer.getInstance().io.emit(
                                        `logPlanCiCd-${payload.id}`,
                                        record
                                    );
                                });
                        },
                    });
                    if (log.code === 0 || log.code === 255) {
                        record.ocean["build"] = {
                            title: "build",
                            status: EStatus.SUCCESSFULLY,
                        };
                        record.logs["build"][0].end_time = new Date();
                        record.logs["build"][0].status = EStatus.SUCCESSFULLY;
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                    }
                    if (log.code !== 0) {
                        record.ocean["build"] = {
                            title: "build",
                            status: EStatus.ERROR,
                        };
                        record.logs["build"][0].end_time = new Date();
                        record.logs["build"][0].status = EStatus.ERROR;
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                        service.environment[env_index].record.push(record.id);
                        record.end_time = new Date();
                        record.status = EStatus.ERROR;
                        await record.save();
                        await service.save();
                        return false;
                    }
                }
                /** handle stage scanImages  */
                if (record.ocean["build"].status === EStatus.SUCCESSFULLY) {
                    record.ocean["scanImages"] = {
                        title: "scanImages",
                        status: EStatus.START,
                    };
                    record.logs["scanImages"] = [];
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    record.ocean["scanImages"] = {
                        title: "scanImages",
                        status: EStatus.IN_PROGRESS,
                    };
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );

                    const imageRegex = /image:\s*docker.io\/(.*)/g;
                    let match: RegExpExecArray | null;
                    const images: string[] = [];

                    while (
                        (match = imageRegex.exec(
                            env!.docker_compose[0].content
                        )) !== null
                    ) {
                        images.push(match[1]);
                    }
                    let i = 0;
                    for (const image of images) {
                        start_time = new Date();
                        command = `trivy image ${image} --format json --scanners vuln`;
                        record.logs["scanImages"].push({
                            log: [],
                            title: "scanImages",
                            sub_title: command,
                            mess: undefined,
                            status: EStatus.IN_PROGRESS,
                            start_time: start_time,
                        });
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                        log = await ssh.execCommand(command);

                        if (log.code !== 0) {
                            record.ocean["scanImages"] = {
                                title: "scanImages",
                                status: EStatus.ERROR,
                            };
                            record.logs["scanImages"][i].end_time = new Date();
                            record.logs["scanImages"][i].status = EStatus.ERROR;
                            SocketServer.getInstance().io.emit(
                                `logPlanCiCd-${payload.id}`,
                                record
                            );
                            service.environment[env_index].record.push(
                                record.id
                            );
                            record.end_time = new Date();
                            record.status = EStatus.ERROR;
                            await record.save();
                            await service.save();
                            return false;
                        }
                        record.logs["scanImages"][i].log?.push(log.stdout);
                        record.logs["scanImages"][i].end_time = new Date();
                        record.logs["scanImages"][i].status =
                            EStatus.SUCCESSFULLY;
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );

                        i++;
                    }
                    if (log && log.code === 0) {
                        record.ocean["scanImages"] = {
                            title: "scanImages",
                            status: EStatus.SUCCESSFULLY,
                        };
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                    }
                }
                /** handle stage deploy  */
                if (
                    record.ocean["scanImages"].status === EStatus.SUCCESSFULLY
                ) {
                    record.ocean["deploy"] = {
                        title: "deploy",
                        status: EStatus.START,
                    };
                    record.logs["deploy"] = [];
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    record.ocean["deploy"] = {
                        title: "deploy",
                        status: EStatus.IN_PROGRESS,
                    };
                    start_time = new Date();
                    command = `cd ${
                        service!.repo
                    } && docker-compose up --build -d`;
                    record.logs["deploy"].push({
                        log: [],
                        title: "deploy",
                        sub_title: command,
                        mess: undefined,
                        status: EStatus.IN_PROGRESS,
                        start_time: start_time,
                    });
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}`,
                        record
                    );
                    log = await ssh.execCommand(command, {
                        onStdout(chunk) {
                            // Gửi log mới đến client
                            // console.log(chunk.toString("utf8"));
                            chunk
                                .toString("utf8")
                                .split("\n")
                                .map((l) => {
                                    record.logs["deploy"][0].log?.push(l);
                                    SocketServer.getInstance().io.emit(
                                        `logPlanCiCd-${payload.id}`,
                                        record
                                    );
                                });
                        },
                        onStderr(chunk) {
                            // Gửi log mới đến client
                            // console.log(chunk.toString("utf8"));
                            chunk
                                .toString("utf8")
                                .split("\n")
                                .map((l) => {
                                    record.logs["deploy"][0].log?.push(l);
                                    SocketServer.getInstance().io.emit(
                                        `logPlanCiCd-${payload.id}`,
                                        record
                                    );
                                });
                        },
                    });
                    if (log.code === 0 || log.code === 255) {
                        record.ocean["deploy"] = {
                            title: "deploy",
                            status: EStatus.SUCCESSFULLY,
                        };
                        record.logs["deploy"][0].end_time = new Date();
                        record.logs["deploy"][0].status = EStatus.SUCCESSFULLY;
                        record.end_time = new Date();
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );
                    }
                    if (log.code !== 0) {
                        record.ocean["deploy"] = {
                            title: "deploy",
                            status: EStatus.ERROR,
                        };
                        record.logs["deploy"][0].end_time = new Date();
                        record.logs["deploy"][0].status = EStatus.ERROR;
                        SocketServer.getInstance().io.emit(
                            `logPlanCiCd-${payload.id}`,
                            record
                        );

                        service.environment[env_index].record.push(record.id);
                        record.end_time = new Date();
                        record.status = EStatus.ERROR;
                        await record.save();
                        await service.save();
                        return false;
                    }
                }
                if (record.ocean["deploy"].status === EStatus.SUCCESSFULLY) {
                    service.environment[env_index].record.push(record.id);
                    record.end_time = new Date();
                    record.status = EStatus.SUCCESSFULLY;
                    await record.save();
                    await service.save();
                    return true;
                }
            }
            return false;
        }
    }
    return false;
}
