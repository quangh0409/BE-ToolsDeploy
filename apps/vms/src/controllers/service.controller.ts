import { Socket } from "socket.io";
import { verifyToken } from "./vms.controller";
import { findTicketByUserId } from "../services/ticket.service";
import { NodeSSH } from "node-ssh";
import Vms from "../models/vms";
import { IEnvironment, IServiceBody } from "../interfaces/request/service.body";
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
import { EStatus } from "../interfaces/models";
import {
    GetBranchesByAccessToken,
    GetLastCommitByAccessToken,
    GetReposGitByAccessToken,
} from "../services/git.service";
import { SocketServer } from "../utils";
import * as yaml from "yaml";

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
        activities: [],
    });

    const vms_ids = params.environments.map((env) => {
        return env.vm;
    });

    const vms = await Vms.updateMany(
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
    console.log("🚀 ~ vms:", vms);

    await service.save();
    return success.ok(service);
}

export async function updateService(
    params: IServiceBody & { id: string }
): Promise<ResultSuccess> {
    const service = await Service.findOneAndUpdate(
        {
            id: params.id,
        },
        {
            $set: {
                name: params.name,
                architectura: params.architectura,
                language: params.language,
                repo: params.repo,
                source: params.source,
                user: params.user,
                environment: [...params.environments],
            },
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
            $addToSet: {
                services: service.id,
            },
        }
    );

    await service.save();
    return success.ok(service);
}

export async function updateEnvService(
    params: IEnvironment & { id: string }
): Promise<ResultSuccess> {
    const service = await Service.findOneAndUpdate(
        {
            id: params.id,
            "environment.name": params.name,
        },
        {
            $set: {
                "environment.$.vm": params.vm,
                "environment.$.docker_file": params.docker_file,
                "environment.$.docker_compose": params.docker_compose,
                "environment.$.postman": params.postman,
                "environment.$.branch": params.branch,
            },
        },
        {
            new: true,
        }
    );

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

    await service.save();
    return success.ok(service);
}

export async function addEnvService(
    params: IEnvironment & { id: string }
): Promise<ResultSuccess> {
    const vm = await Vms.findOneAndUpdate(
        {
            id: params.vm,
        },
        {
            $push: {
                services: params.id,
            },
        }
    );

    if (!vm) {
        throw new HttpError(
            error.notFound({
                location: "params",
                param: "vm",
                message: `VM-instance not exit`,
                value: params.vm,
            })
        );
    }
    const service = await Service.findOneAndUpdate(
        {
            id: params.id,
        },
        {
            $push: {
                environment: {
                    name: params.name,
                    vm: params.vm,
                    branch: params.branch,
                    docker_file: params.docker_file,
                    docker_compose: params.docker_compose,
                    postman: params.postman,
                    record: [],
                },
            },
        },
        {
            new: true,
        }
    );

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
    return success.ok(service);
}

export async function deleteEnvService(params: {
    id: string;
    name: string;
}): Promise<ResultSuccess> {
    const service = await Service.findOneAndUpdate(
        {
            id: params.id,
        },
        {
            $pull: {
                environment: {
                    name: params.name,
                },
            },
        },
        {
            new: true,
        }
    );

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
            services: params.id,
        },
        {
            $pull: {
                services: params.id,
            },
        }
    );

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

    vm.services = services;
    await vm.save();

    return success.ok({ message: "successfully deleted" });
}

export async function deleteServiceInAllVm(params: {
    id: string;
}): Promise<ResultSuccess> {
    const check = await Service.deleteOne({ id: params.id });
    if (check.deletedCount !== 1) {
        throw new HttpError(
            error.notFound({
                message: `service not exited, failed delete`,
                value: params.id,
            })
        );
    }

    await Vms.updateMany(
        { services: params.id },
        {
            $pull: {
                services: params.id,
            },
        }
    );

    return success.ok({ message: "successfully deleted" });
}

export async function getAllService(params: {
    vm: string;
    name?: string;
}): Promise<ResultSuccess> {
    console.log("🚀 ~ params:", params);
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

    const services = await Service.aggregate([
        {
            $match: {
                id: {
                    $in: vm.services,
                },
                name: {
                    $regex: `${params?.name ? params.name : ""}`,
                    $options: "i",
                },
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
    ]).then(async (res) => {
        const data = res;
        let last:
            | {
                  id?: string;
                  service_name?: string;
                  service_id?: string;
                  serivce_architecture?: string;
                  env_name?: string;
                  branch?: string;
                  vm?: { host: string; id: string };
                  status?: EStatus;
                  created_time?: Date;
                  commit_id?: string;
                  commit_message?: string;
                  commit_html_url?: string;
                  index?: number;
                  end_time?: Date;
              }
            | undefined;
        let environment: any | undefined;
        for (let i = 0; i < data.length; i++) {
            environment = data[i].environment.find(
                (env: any) => env.vm === params.vm
            );
            console.log("🚀 ~ ).then ~ environment:", !!environment);
            if (environment) {
                const [record, vm] = await Promise.all([
                    Record.findOne({ id: environment.record.at(-1) }),
                    Vms.findOne({ id: params.vm }),
                ]);

                if (!record || !vm) {
                    throw new HttpError(
                        error.notFound({
                            message: "record or vm not found",
                        })
                    );
                }

                last = {
                    id: record.id,
                    service_name: data[i]?.name,
                    serivce_architecture: data[i]?.architectura,
                    service_id: data[i]?.id,
                    env_name: environment.name,
                    branch: record.branch,
                    vm: { host: vm.host, id: vm.id },
                    status: record.status,
                    created_time: record.created_time,
                    commit_id: record.commit_id,
                    commit_message: record.commit_message,
                    commit_html_url: record.commit_html_url,
                    index: record.index,
                    end_time: record.end_time,
                };

                const compose = yaml.parse(
                    environment.docker_compose[0].content
                );

                const containers_number = Object.keys(compose.services).length;
                const containerNames = Object.values(compose.services).map(
                    (service: any) => service.container_name
                );
                const images_number = new Set(
                    Object.values(compose.services).map(
                        (service: any) => service?.image
                    )
                ).size;

                const ssh = new NodeSSH();
                await ssh.connect({
                    host: vm!.host,
                    username: vm!.user,
                    password: vm!.pass,
                    port: Number.parseInt(vm!.port),
                    tryKeyboard: true,
                });

                let containers: any[] = [];
                let command = "docker stats --format json --no-stream";

                let log = await ssh.execCommand(command);
                if (log.stdout !== "") {
                    containers = log.stdout
                        .split("\n")
                        .map((r) => JSON.parse(r));
                }

                command = "docker ps -a --format json";
                log = await ssh.execCommand(command);
                let containers_: any[] = [];
                if (log.stdout !== "") {
                    containers_ = log.stdout
                        .split("\n")
                        .map((r) => JSON.parse(r));

                    containers_ = containers_.map((container_, idx) => {
                        const container = containers.find((container) => {
                            return container?.ID === container_?.ID;
                        });
                        if (container) {
                            return {
                                ...container,
                                Ports: container_?.Ports,
                                Image: container_?.Image,
                                Status: container_?.Status,
                            };
                        } else {
                            return {
                                Container: container_?.ID,
                                ID: container_?.ID,
                                Name: container_?.Names,
                                Ports: container_?.Ports,
                                Image: container_?.Image,
                                Status: container_?.Status,
                            };
                        }
                    });
                }

                containers_ = containers_.filter((element) =>
                    containerNames.includes(element.Name)
                );

                log = await ssh.execCommand(`docker images --format json`);
                const images_ = log.stdout
                    .split("\n")
                    .map((item) => JSON.parse(item));

                const imageRegex = /image:\s*docker.io\/(.*)/g;
                let match: RegExpExecArray | null;
                const images: string[] = [];

                while (
                    (match = imageRegex.exec(
                        environment.docker_compose[0].content
                    )) !== null
                ) {
                    images.push(match[1]);
                }

                const result = images_.filter((element) =>
                    images.includes(element.Repository)
                );

                environment = [
                    {
                        last: last,
                        containers: {
                            number: containers_number,
                            containers_info: containers_,
                        },
                        images: {
                            number: images_number,
                            images_info: result,
                        },
                    },
                ];
            }

            Object.assign(data[i], {
                environment_info: environment,
                environment: undefined,
                activities: undefined,
            });
        }

        return data;
    });

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
        console.log("🚀 ~ e:", e);
        const vm = await Vms.findOne({ id: e.vm });
        console.log("🚀 ~ vm:", vm);
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
}): Promise<ResultSuccess> {
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
            port: Number.parseInt(vm!.port),
            tryKeyboard: true,
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

        const result = images_.filter((element) =>
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

export async function getContaninersOfServiceById(params: {
    service: string;
    env: string;
}): Promise<ResultSuccess> {
    const service = await Service.findOne({ id: params.service });
    const ssh = new NodeSSH();

    if (service) {
        const environment = service.environment.find(
            (e) => e.name === params.env
        );

        const vm = await Vms.findOne({
            id: environment!.vm,
        });
        const compose = yaml.parse(environment!.docker_compose[0].content);

        const containerNames = Object.values(compose.services).map(
            (service: any) => service.container_name
        );

        await ssh.connect({
            host: vm!.host,
            username: vm!.user,
            password: vm!.pass,
            port: Number.parseInt(vm!.port),
            tryKeyboard: true,
        });

        let containers: any[] = [];
        let command = "docker stats --format json --no-stream";

        let log = await ssh.execCommand(command);
        if (log.stdout !== "") {
            containers = log.stdout.split("\n").map((r) => JSON.parse(r));
        }

        command = "docker ps -a --format json";
        log = await ssh.execCommand(command);
        let containers_: any[] = [];
        if (log.stdout !== "") {
            containers_ = log.stdout.split("\n").map((r) => JSON.parse(r));

            containers_ = containers_.map((container_, idx) => {
                const container = containers.find((container) => {
                    return container?.ID === container_?.ID;
                });
                if (container) {
                    return {
                        ...container,
                        Ports: container_?.Ports,
                        Image: container_?.Image,
                        Status: container_?.Status,
                    };
                } else {
                    return {
                        Container: container_?.ID,
                        ID: container_?.ID,
                        Name: container_?.Names,
                        Ports: container_?.Ports,
                        Image: container_?.Image,
                        Status: container_?.Status,
                    };
                }
            });
        }

        containers_ = containers_.filter((element) =>
            containerNames.includes(element.Name)
        );

        return success.ok({ containers_ });
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
            port: Number.parseInt(vm!.port),
            tryKeyboard: true,
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
    console.log(service, env);
    if (ser) {
        const environment = ser.environment.find((e) => e.name === env);

        const vm = await Vms.findOne({
            id: environment!.vm,
        });

        await ssh.connect({
            host: vm!.host,
            username: vm!.user,
            password: vm!.pass,
            port: Number.parseInt(vm!.port),
            tryKeyboard: true,
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
): Promise<boolean> {
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
                        port: Number.parseInt(vm!.port),
                        tryKeyboard: true,
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
                    if (service.activities) {
                        service.activities.push({
                            name_env: env!.name,
                            modify_time: new Date(),
                            record_id: record.id,
                            vm: env!.vm,
                        });
                    } else {
                        service.activities = [
                            {
                                name_env: env!.name,
                                modify_time: new Date(),
                                record_id: record.id,
                                vm: env!.vm,
                            },
                        ];
                    }
                    if (vm.activities) {
                        vm.activities.push({
                            service_id: service.id,
                            modify_time: new Date(),
                        });
                    } else {
                        vm.activities = [
                            {
                                service_id: service.id,
                                modify_time: new Date(),
                            },
                        ];
                    }
                    await vm.save();
                    record.end_time = new Date();
                    record.status = EStatus.ERROR;
                    await record.save();
                    await service.save();
                    return false;
                }

                let log;
                let command;
                /** handle stage clone  */
                /**@TODO thêm chức năng viết lại file diockerfile, docker-compose khi chỉnh sửa */
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
                                if (service.activities) {
                                    service.activities.push({
                                        name_env: env!.name,
                                        modify_time: new Date(),
                                        record_id: record.id,
                                        vm: env!.vm,
                                    });
                                } else {
                                    service.activities = [
                                        {
                                            name_env: env!.name,
                                            modify_time: new Date(),
                                            record_id: record.id,
                                            vm: env!.vm,
                                        },
                                    ];
                                }
                                if (vm.activities) {
                                    vm.activities.push({
                                        service_id: service.id,
                                        modify_time: new Date(),
                                    });
                                } else {
                                    vm.activities = [
                                        {
                                            service_id: service.id,
                                            modify_time: new Date(),
                                        },
                                    ];
                                }
                                await vm.save();
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
                        for (const docker_compose of env!.docker_compose) {
                            start_time = new Date();
                            command = `cat > ${service.repo}/${docker_compose.location}`;
                            log = await ssh.execCommand(command, {
                                stdin: docker_compose.content,
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
                                if (service.activities) {
                                    service.activities.push({
                                        name_env: env!.name,
                                        modify_time: new Date(),
                                        record_id: record.id,
                                        vm: env!.vm,
                                    });
                                } else {
                                    service.activities = [
                                        {
                                            name_env: env!.name,
                                            modify_time: new Date(),
                                            record_id: record.id,
                                            vm: env!.vm,
                                        },
                                    ];
                                }
                                if (vm.activities) {
                                    vm.activities.push({
                                        service_id: service.id,
                                        modify_time: new Date(),
                                    });
                                } else {
                                    vm.activities = [
                                        {
                                            service_id: service.id,
                                            modify_time: new Date(),
                                        },
                                    ];
                                }
                                await vm.save();
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
                        if (service.activities) {
                            service.activities.push({
                                name_env: env!.name,
                                modify_time: new Date(),
                                record_id: record.id,
                                vm: env!.vm,
                            });
                        } else {
                            service.activities = [
                                {
                                    name_env: env!.name,
                                    modify_time: new Date(),
                                    record_id: record.id,
                                    vm: env!.vm,
                                },
                            ];
                        }
                        if (vm.activities) {
                            vm.activities.push({
                                service_id: service.id,
                                modify_time: new Date(),
                            });
                        } else {
                            vm.activities = [
                                {
                                    service_id: service.id,
                                    modify_time: new Date(),
                                },
                            ];
                        }
                        await vm.save();
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
                                if (service.activities) {
                                    service.activities.push({
                                        name_env: env!.name,
                                        modify_time: new Date(),
                                        record_id: record.id,
                                        vm: env!.vm,
                                    });
                                } else {
                                    service.activities = [
                                        {
                                            name_env: env!.name,
                                            modify_time: new Date(),
                                            record_id: record.id,
                                            vm: env!.vm,
                                        },
                                    ];
                                }
                                if (vm.activities) {
                                    vm.activities.push({
                                        service_id: service.id,
                                        modify_time: new Date(),
                                    });
                                } else {
                                    vm.activities = [
                                        {
                                            service_id: service.id,
                                            modify_time: new Date(),
                                        },
                                    ];
                                }
                                await vm.save();
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
                                if (service.activities) {
                                    service.activities.push({
                                        name_env: env!.name,
                                        modify_time: new Date(),
                                        record_id: record.id,
                                        vm: env!.vm,
                                    });
                                } else {
                                    service.activities = [
                                        {
                                            name_env: env!.name,
                                            modify_time: new Date(),
                                            record_id: record.id,
                                            vm: env!.vm,
                                        },
                                    ];
                                }
                                if (vm.activities) {
                                    vm.activities.push({
                                        service_id: service.id,
                                        modify_time: new Date(),
                                    });
                                } else {
                                    vm.activities = [
                                        {
                                            service_id: service.id,
                                            modify_time: new Date(),
                                        },
                                    ];
                                }
                                await vm.save();
                                record.end_time = new Date();
                                record.status = EStatus.ERROR;
                                await record.save();
                                await service.save();
                                return false;
                            }
                            record.logs["scanSyntax"].push({
                                log: [""],
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
                        if (service.activities) {
                            service.activities.push({
                                name_env: env!.name,
                                modify_time: new Date(),
                                record_id: record.id,
                                vm: env!.vm,
                            });
                        } else {
                            service.activities = [
                                {
                                    name_env: env!.name,
                                    modify_time: new Date(),
                                    record_id: record.id,
                                    vm: env!.vm,
                                },
                            ];
                        }
                        if (vm.activities) {
                            vm.activities.push({
                                service_id: service.id,
                                modify_time: new Date(),
                            });
                        } else {
                            vm.activities = [
                                {
                                    service_id: service.id,
                                    modify_time: new Date(),
                                },
                            ];
                        }
                        await vm.save();
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
                        if (service.activities) {
                            service.activities.push({
                                name_env: env!.name,
                                modify_time: new Date(),
                                record_id: record.id,
                                vm: env!.vm,
                            });
                        } else {
                            service.activities = [
                                {
                                    name_env: env!.name,
                                    modify_time: new Date(),
                                    record_id: record.id,
                                    vm: env!.vm,
                                },
                            ];
                        }
                        if (vm.activities) {
                            vm.activities.push({
                                service_id: service.id,
                                modify_time: new Date(),
                            });
                        } else {
                            vm.activities = [
                                {
                                    service_id: service.id,
                                    modify_time: new Date(),
                                },
                            ];
                        }
                        await vm.save();
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
                            const log: string[] = chunk
                                .toString("utf8")
                                .split("\n")
                                .map((l) => {
                                    return l;
                                });
                            record.logs["build"][0].log?.push(...log);
                            SocketServer.getInstance().io.emit(
                                `logPlanCiCd-${payload.id}`,
                                record
                            );
                        },
                        onStderr(chunk) {
                            // Gửi log mới đến client
                            // console.log(chunk.toString("utf8"));
                            const log: string[] = chunk
                                .toString("utf8")
                                .split("\n")
                                .map((l) => {
                                    return l;
                                });
                            record.logs["build"][0].log?.push(...log);
                            SocketServer.getInstance().io.emit(
                                `logPlanCiCd-${payload.id}`,
                                record
                            );
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
                        if (service.activities) {
                            service.activities.push({
                                name_env: env!.name,
                                modify_time: new Date(),
                                record_id: record.id,
                                vm: env!.vm,
                            });
                        } else {
                            service.activities = [
                                {
                                    name_env: env!.name,
                                    modify_time: new Date(),
                                    record_id: record.id,
                                    vm: env!.vm,
                                },
                            ];
                        }
                        if (vm.activities) {
                            vm.activities.push({
                                service_id: service.id,
                                modify_time: new Date(),
                            });
                        } else {
                            vm.activities = [
                                {
                                    service_id: service.id,
                                    modify_time: new Date(),
                                },
                            ];
                        }
                        await vm.save();
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
                            record.logs["scanImages"][i].log?.push(log.stderr);
                            record.logs["scanImages"][i].end_time = new Date();
                            record.logs["scanImages"][i].status = EStatus.ERROR;
                            SocketServer.getInstance().io.emit(
                                `logPlanCiCd-${payload.id}`,
                                record
                            );
                            service.environment[env_index].record.push(
                                record.id
                            );
                            if (service.activities) {
                                service.activities.push({
                                    name_env: env!.name,
                                    modify_time: new Date(),
                                    record_id: record.id,
                                    vm: env!.vm,
                                });
                            } else {
                                service.activities = [
                                    {
                                        name_env: env!.name,
                                        modify_time: new Date(),
                                        record_id: record.id,
                                        vm: env!.vm,
                                    },
                                ];
                            }
                            if (vm.activities) {
                                vm.activities.push({
                                    service_id: service.id,
                                    modify_time: new Date(),
                                });
                            } else {
                                vm.activities = [
                                    {
                                        service_id: service.id,
                                        modify_time: new Date(),
                                    },
                                ];
                            }
                            await vm.save();
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
                        `logPlanCiCd-${payload.id}-deploy`,
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
                        `logPlanCiCd-${payload.id}-deploy`,
                        record
                    );
                    log = await ssh.execCommand(
                        command
                        //      {
                        //     onStdout(chunk) {
                        //         // Gửi log mới đến client
                        //         // console.log(chunk.toString("utf8"));
                        //         const log: string[] = chunk
                        //             .toString("utf8")
                        //             .split("\n")
                        //             .map((l) => {
                        //                 return l;
                        //             });
                        //         record.logs["deploy"][0].log?.push(...log);
                        //         SocketServer.getInstance().io.emit(
                        //             `logPlanCiCd-${payload.id}`,
                        //             record
                        //         );
                        //     },
                        //     onStderr(chunk) {
                        //         // Gửi log mới đến client
                        //         // console.log(chunk.toString("utf8"));
                        //         const log: string[] = chunk
                        //             .toString("utf8")
                        //             .split("\n")
                        //             .map((l) => {
                        //                 return l;
                        //             });
                        //         record.logs["deploy"][0].log?.push(...log);
                        //         SocketServer.getInstance().io.emit(
                        //             `logPlanCiCd-${payload.id}`,
                        //             record
                        //         );
                        //     },
                        // }
                    );
                    record.logs["deploy"][0].log?.push(
                        ...log.stderr.split("\n")
                    );
                    SocketServer.getInstance().io.emit(
                        `logPlanCiCd-${payload.id}-deploy`,
                        record
                    );
                    if (log.code === 0 || log.code === 255) {
                        record.ocean["deploy"] = {
                            title: "deploy",
                            status: EStatus.SUCCESSFULLY,
                        };
                        record.logs["deploy"][0].end_time = new Date();
                        record.logs["deploy"][0].status = EStatus.SUCCESSFULLY;
                        record.end_time = new Date();
                        record.status = EStatus.SUCCESSFULLY;
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
                        if (service.activities) {
                            service.activities.push({
                                name_env: env!.name,
                                modify_time: new Date(),
                                record_id: record.id,
                                vm: env!.vm,
                            });
                        } else {
                            service.activities = [
                                {
                                    name_env: env!.name,
                                    modify_time: new Date(),
                                    record_id: record.id,
                                    vm: env!.vm,
                                },
                            ];
                        }
                        if (vm.activities) {
                            vm.activities.push({
                                service_id: service.id,
                                modify_time: new Date(),
                            });
                        } else {
                            vm.activities = [
                                {
                                    service_id: service.id,
                                    modify_time: new Date(),
                                },
                            ];
                        }
                        await vm.save();
                        record.end_time = new Date();
                        record.status = EStatus.ERROR;
                        await record.save();
                        await service.save();
                        return false;
                    }
                }
                if (record.ocean["deploy"].status === EStatus.SUCCESSFULLY) {
                    service.environment[env_index].record.push(record.id);
                    if (service.activities) {
                        service.activities.push({
                            name_env: env!.name,
                            modify_time: new Date(),
                            record_id: record.id,
                            vm: env!.vm,
                        });
                    } else {
                        service.activities = [
                            {
                                name_env: env!.name,
                                modify_time: new Date(),
                                record_id: record.id,
                                vm: env!.vm,
                            },
                        ];
                    }
                    if (vm.activities) {
                        vm.activities.push({
                            service_id: service.id,
                            modify_time: new Date(),
                        });
                    } else {
                        vm.activities = [
                            {
                                service_id: service.id,
                                modify_time: new Date(),
                            },
                        ];
                    }
                    await vm.save();
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

export async function getAllInfoOfRepos(params: {
    userId: string;
    name?: string;
}): Promise<ResultSuccess> {
    const repos = await GetReposGitByAccessToken(params);

    if (repos.status !== 200 && !repos?.body) {
        throw new HttpError({
            status: HttpStatus.INTERNAL_SERVER,
            errors: [
                {
                    message: "Error call api internal of service git",
                },
            ],
        });
    }

    const repositorys: {
        name: string;
        full_name: string;
        html_url: string;
        language: string;
    }[] = repos.body.data.map((repo: any) => {
        return {
            name: repo.name,
            full_name: repo.full_name,
            html_url: repo.html_url,
            language: repo.language,
        };
    });

    let result: any[] = [];

    for (const repo of repositorys) {
        const [service, branchs] = await Promise.all([
            await Service.findOne({ repo: repo.name }),
            await GetBranchesByAccessToken({
                userId: params.userId,
                repository: repo.name,
            }),
        ]);
        let last:
            | {
                  id?: string;
                  service_name?: string;
                  service_id?: string;
                  serivce_architecture?: string;
                  env_name?: string;
                  branch?: string;
                  vm?: { host: string; id: string };
                  status?: EStatus;
                  created_time?: Date;
                  commit_id?: string;
                  commit_message?: string;
                  commit_html_url?: string;
                  index?: number;
                  end_time?: Date;
              }
            | undefined;

        const activity = service?.activities.at(-1);
        const environments = service?.environment;

        if (activity) {
            const [record, vm] = await Promise.all([
                Record.findOne({ id: activity.record_id }),
                Vms.findOne({ id: activity.vm }),
            ]);

            if (!record || !vm) {
                throw new HttpError(
                    error.notFound({
                        message: "record or vm not found",
                    })
                );
            }

            last = {
                id: record.id,
                service_name: service?.name,
                serivce_architecture: service?.architectura,
                service_id: service?.id,
                env_name: activity.name_env,
                branch: record.branch,
                vm: { host: vm.host, id: vm.id },
                status: record.status,
                created_time: record.created_time,
                commit_id: record.commit_id,
                commit_message: record.commit_message,
                commit_html_url: record.commit_html_url,
                index: record.index,
                end_time: record.end_time,
            };
        }
        const branchs_custom: any[] = [];

        for (const { branch: b } of branchs.body.data) {
            const env = environments?.find((env) => {
                return env.branch === b;
            });
            if (env) {
                const [record_success, record_error, last_record, vm_env] =
                    await Promise.all([
                        Record.find({
                            id: {
                                $in: env.record,
                            },
                            status: EStatus.SUCCESSFULLY,
                        }).count(),
                        Record.find({
                            id: {
                                $in: env.record,
                            },
                            status: EStatus.ERROR,
                        }).count(),
                        Record.findOne({
                            id: env.record.at(-1),
                        }),
                        Vms.findOne({ id: env.vm }),
                    ]);

                branchs_custom.push({
                    name: env.name,
                    branch: env.branch,
                    vm: { host: vm_env?.host, id: vm_env?.id },
                    record_success: record_success,
                    record_error: record_error,
                    last_record: {
                        id: last_record?.id,
                        branch: last_record?.branch,
                        vm: { host: vm_env?.host, id: vm_env?.id },
                        status: last_record?.status,
                        created_time: last_record?.created_time,
                        commit_id: last_record?.commit_id,
                        commit_message: last_record?.commit_message,
                        commit_html_url: last_record?.commit_html_url,
                        index: last_record?.index,
                        end_time: last_record?.end_time,
                    },
                });
            } else {
                const last_commit = await GetLastCommitByAccessToken({
                    userId: params.userId,
                    repository: repo.name,
                    branch: b,
                });
                if (!last_commit.body) {
                    throw new HttpError(
                        error.notFound({
                            message: "last commit not found",
                        })
                    );
                }
                branchs_custom.push({
                    branch: b,
                    last_commit: last_commit.body,
                });
            }
        }

        result.push({
            service_id: service?.id,
            serivce_architecture: service?.architectura,
            ...repo,
            last: last,
            branchs: branchs_custom,
        });
    }

    return success.ok(result);
}

export async function getAllInfoOfReposForDashboard(params: {
    userId: string;
}): Promise<ResultSuccess> {
    const repos = await GetReposGitByAccessToken(params);

    if (repos.status !== 200 && !repos?.body) {
        throw new HttpError({
            status: HttpStatus.INTERNAL_SERVER,
            errors: [
                {
                    message: "Error call api internal of service git",
                },
            ],
        });
    }

    const repositorys: {
        name: string;
        full_name: string;
        html_url: string;
        language: string;
    }[] = repos.body.data.map((repo: any) => {
        return {
            name: repo.name,
            full_name: repo.full_name,
            html_url: repo.html_url,
            language: repo.language,
        };
    });

    let result: any[] = [];
    let total_deployed: number = 0;
    let total_undeveloped: number = 0;

    for (const repo of repositorys) {
        const [service, branchs] = await Promise.all([
            await Service.findOne({ repo: repo.name }),
            await GetBranchesByAccessToken({
                userId: params.userId,
                repository: repo.name,
            }),
        ]);

        if (service) {
            total_deployed++;
            const environments = service?.environment;
            let total_success: number = 0;
            let total_failed: number = 0;

            let activities: any[] = [];

            for (const activity of service.activities) {
                const [record, vm] = await Promise.all([
                    Record.findOne(
                        { id: activity.record_id },
                        {
                            _id: 0,
                            status: 1,
                            index: 1,
                            created_time: 1,
                            end_time: 1,
                            id: 1,
                        }
                    ),
                    Vms.findOne(
                        { id: activity.vm },
                        { _id: 0, id: 1, host: 1 }
                    ),
                ]);

                if (record?.status === "SUCCESSFULLY") {
                    total_success++;
                } else {
                    total_failed++;
                }

                activities.push({
                    name_env: activity.name_env,
                    modify_time: activity.modify_time,
                    record: record,
                    vm: vm,
                });
                // Object.assign(activity, record, vm);
            }

            const branchs_custom: any[] = [];

            for (const { branch: b } of branchs.body.data) {
                const env = environments?.find((env) => {
                    return env.branch === b;
                });
                if (env) {
                    const [record_success, record_error, records, vm] =
                        await Promise.all([
                            Record.find({
                                id: {
                                    $in: env.record,
                                },
                                status: EStatus.SUCCESSFULLY,
                            }).count(),
                            Record.find({
                                id: {
                                    $in: env.record,
                                },
                                status: EStatus.ERROR,
                            }).count(),
                            Record.find(
                                {
                                    id: {
                                        $in: env.record,
                                    },
                                },
                                {
                                    _id: 0,
                                    status: 1,
                                    index: 1,
                                    created_time: 1,
                                    end_time: 1,
                                    id: 1,
                                }
                            ),
                            Vms.findOne({ id: env.vm }),
                        ]);

                    branchs_custom.push({
                        name: env.name,
                        branch: env.branch,
                        record_success: record_success,
                        record_error: record_error,
                        records: records,
                        vm: { host: vm?.host, id: vm?.id },
                    });
                } else {
                    branchs_custom.push({
                        branch: b,
                    });
                }
            }

            result.push({
                service_id: service?.id,
                ...repo,
                branchs: branchs_custom,
                activities: activities,
                total_success: total_success,
                total_failed: total_failed,
            });
        } else {
            total_undeveloped++;
        }
    }

    return success.ok({
        total: repositorys.length,
        total_deployed: total_deployed,
        total_undeveloped: total_undeveloped,
        repos: result,
    });
}
