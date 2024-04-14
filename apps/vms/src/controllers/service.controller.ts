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

export async function deleteService(params: {
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
    return success.ok(service);
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

export async function clone(
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
                    socket.emit("logStepClone", {
                        log: undefined,
                        title: "clone",
                        sub_title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                    return false;
                }

                // TODO xu ly service de laays tham soos
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logStepClone", {
                        log: undefined,
                        title: "clone",
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

                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });

                    socket.emit("logStepClone", {
                        log: undefined,
                        title: "clone",
                        sub_title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "START",
                    });
                } catch (err: any) {
                    socket.emit("logStepClone", {
                        log: undefined,
                        title: "clone",
                        sub_title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                    return false;
                }

                let log;
                log = await ssh.execCommand(
                    `git clone ${service!.source} 2> /dev/null || (rm -rf ${
                        service!.repo
                    } ; git clone ${service!.source})`
                );
                socket.emit("logStepClone", {
                    log: log,
                    title: "clone",
                    sub_title: `git clone ${
                        service!.source
                    } 2> /dev/null || (rm -rf ${service!.repo} ; git clone ${
                        service!.source
                    })`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });

                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd ${service!.repo} && git checkout ${env!.branch}`
                    );
                    socket.emit("logStepClone", {
                        log: log,
                        title: "clone",
                        sub_title: `cd ${service!.repo} && git checkout ${
                            env!.branch
                        }`,
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }

                for (const docker_file of env!.docker_file) {
                    const command = `cat > ${service.repo}/${docker_file.location}`;
                    await ssh.execCommand(command, {
                        stdin: docker_file.content,
                    });
                }

                if (log.code === 0) {
                    socket.emit("logStepClone", {
                        log: log,
                        title: "clone",
                        sub_title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                    // ssh.dispose()
                    return true;
                }
                if (log.code !== 0) {
                    socket.emit("logStepClone", {
                        log: log,
                        title: "clone",
                        sub_title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                    // ssh.dispose()
                    return false;
                }
            }
            return false;
        }
    }
    return false;
}

export async function scanDockerfile(
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
                    socket.emit("logStepScanDockerfile", {
                        log: undefined,
                        title: "scanDockerfile",
                        sub_title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                    return false;
                }
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logStepScanDockerfile", {
                        log: undefined,
                        title: "scanDockerfile",
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

                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });

                    socket.emit("logStepScanDockerfile", {
                        log: undefined,
                        title: "scanDockerfile",
                        sub_title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "START",
                    });
                } catch (err: any) {
                    socket.emit("logStepScanDockerfile", {
                        log: undefined,
                        title: "scanDockerfile",
                        sub_title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                    return false;
                }

                let log;
                log = await ssh.execCommand(
                    "cd " + service!.repo + " && hadolint Dockerfile"
                );
                socket.emit("logStepScanDockerfile", {
                    log: log,
                    title: "scanDockerfile",
                    sub_title: `hadolint ./${service!.repo}/Dockerfile`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                log = await ssh.execCommand(
                    "cd " + service!.repo + " && hadolint docker-compose.yaml"
                );
                socket.emit("logStepScanDockerfile", {
                    log: log,
                    title: "scanDockerfile",
                    sub_title: `hadolint ./${
                        service!.repo
                    }/docker-compose.yaml`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                socket.emit("logStepScanDockerfile", {
                    // log: log,
                    title: "scanDockerfile",
                    sub_title: undefined,
                    mess: "SUCCESSFULLY",
                    status: "SUCCESSFULLY",
                });
                return true;
            }
            return false;
        }
        return false;
    }
    return false;
}

export async function clear(
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
                    socket.emit("logsStepClear", {
                        log: undefined,
                        title: "clear",
                        sub_title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                    return false;
                }
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logsStepClear", {
                        log: undefined,
                        title: "clear",
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
                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });

                    socket.emit("logsStepClear", {
                        log: undefined,
                        title: "clear",
                        sub_title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "START",
                    });
                } catch (err: any) {
                    socket.emit("logsStepClear", {
                        log: undefined,
                        title: "clear",
                        sub_title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                    return false;
                }

                let log;
                socket.emit("logsStepClear", {
                    log: undefined,
                    title: "clear",
                    // sub_title: `docker stop $(docker ps -aq) || echo no container && docker rmi -f $(docker images -q) || echo no image && docker builder prune -f`,
                    sub_title: `docker builder prune -f`,

                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                log = await ssh.execCommand(
                    `docker builder prune -f`,

                    {
                        onStdout(chunk) {
                            // Gửi log mới đến client
                            // console.log(chunk.toString("utf8"));
                            chunk
                                .toString("utf8")
                                .split("\n")
                                .map((l) => {
                                    socket.emit("logRealTimeClear", l);
                                });
                        },
                    }
                );

                if (log.code === 0) {
                    socket.emit("logsStepClear", {
                        log: log,
                        title: "clear",
                        sub_title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                    return true;
                }
                if (log.code !== 0) {
                    socket.emit("logsStepClear", {
                        log: log,
                        title: "clear",
                        sub_title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                    return false;
                }
            }
            return false;
        }
        return false;
    }
    return false;
}

export async function build(
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
                    socket.emit("logStepBuild", {
                        log: undefined,
                        title: "build",
                        sub_title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                    return false;
                }
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logStepBuild", {
                        log: undefined,
                        title: "build",
                        sub_title: undefined,
                        mess: "SERVICE NOT EXITED",
                        status: "ERROR",
                    });
                    return false;
                }
                const env = service!.environment.find((e) => {
                    return e.name === env_name;
                });

                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });

                    socket.emit("logStepBuild", {
                        log: undefined,
                        title: "build",
                        sub_title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "START",
                    });
                } catch (err: any) {
                    socket.emit("logStepBuild", {
                        log: undefined,
                        title: "build",
                        sub_title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                    return false;
                }

                let log;
                socket.emit("logStepBuild", {
                    log: undefined,
                    title: "build",
                    sub_title: `cd ${
                        service!.repo
                    } && chmod +x ./nginx/entrypoint.sh && chmod +x docker-compose.yaml  && docker compose -f ./docker-compose.yaml build`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                log = await ssh.execCommand(
                    `cd ${
                        service!.repo
                    } && chmod +x ./nginx/entrypoint.sh && chmod +x docker-compose.yaml  && docker compose -f ./docker-compose.yaml build`,
                    {
                        onStdout(chunk) {
                            // Gửi log mới đến client
                            // console.log(chunk.toString("utf8"));
                            chunk
                                .toString("utf8")
                                .split("\n")
                                .map((l) => {
                                    socket.emit("logRealTimeBuild", l);
                                });
                        },
                    }
                );

                if (log.code === 0) {
                    socket.emit("logStepBuild", {
                        log: log,
                        title: "build",
                        sub_title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                    return true;
                }
                if (log.code !== 0) {
                    socket.emit("logStepBuild", {
                        log: log,
                        title: "build",
                        sub_title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                    return false;
                }
            }
            return false;
        }
        return false;
    }
    return false;
}

export async function scanImages(
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
                    socket.emit("logStepScanImage", {
                        log: undefined,
                        title: "scanImages",
                        sub_title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                    return false;
                }

                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logStepScanImage", {
                        log: undefined,
                        title: "scanImages",
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
                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });

                    socket.emit("logStepScanImage", {
                        log: undefined,
                        title: "scanImages",
                        sub_title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "START",
                    });
                } catch (err: any) {
                    socket.emit("logStepScanImage", {
                        log: undefined,
                        title: "scanImages",
                        sub_title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                    return false;
                }

                let log;

                // log = await ssh.execCommand(
                //     `docker images --format json`
                //     //  {
                //     //     onStdout(chunk) {
                //     //         // Gửi log mới đến client
                //     //         // console.log(chunk.toString("utf8"));
                //     //         socket.emit(
                //     //             "logRealTimeScanImages",
                //     //             chunk.toString("utf8")
                //     //         );
                //     //     },
                //     // }
                // );
                // const images = log.stdout
                //     .split("\n")
                //     .map((item) => JSON.parse(item));

                // Sử dụng biểu thức chính quy để tìm tất cả các tên image và loại bỏ "docker.io/"
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

                // In ra danh sách các images đã loại bỏ "docker.io/"
                for (const image of images) {
                    try {
                        socket.emit("logStepScanImage", {
                            log: log,
                            title: "scanImages",
                            sub_title: `trivy image ${image}`,
                            mess: undefined,
                            status: "IN_PROGRESS",
                        });

                        log = await ssh.execCommand(
                            `trivy image ${image} --format json --scanners vuln`
                            // {
                            //     onStdout(chunk) {
                            //         // Gửi log mới đến client
                            //         // console.log(chunk.toString("utf8"));
                            //         chunk
                            //             .toString("utf8")
                            //             .split("\n")
                            //             .map((l) => {
                            //                 socket.emit("logRealTimeScanImages", {
                            //                     sub_title: `trivy image ${image}`,
                            //                     log: l,
                            //                 });
                            //             });
                            //     },
                            // }
                        );
                        socket.emit("logRealTimeScanImages", {
                            sub_title: `trivy image ${image}`,
                            log: JSON.parse(log.stdout),
                        });
                    } catch (error) {
                        console.log("🚀 ~ error:", error);
                        socket.emit("logStepScanImage", {
                            log: log,
                            title: "scanImages",
                            sub_title: undefined,
                            mess: "ERROR",
                            status: "ERROR",
                        });
                        return false;
                    }
                }

                socket.emit("logStepScanImage", {
                    log: log,
                    title: "scanImages",
                    sub_title: undefined,
                    mess: "SUCCESSFULLY",
                    status: "SUCCESSFULLY",
                });
                return true;
            }
            return false;
        }
        return false;
    }
    return false;
}

export async function deploy(
    socket: Socket,
    token: string,
    vm_id: string,
    service_id: string,
    env_name: string
) {
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
                    socket.emit("logStepDeploy", {
                        log: undefined,
                        title: "deploy",
                        sub_title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                    return false;
                }
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logStepDeploy", {
                        log: undefined,
                        title: "deploy",
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

                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });

                    socket.emit("logStepDeploy", {
                        log: undefined,
                        title: "deploy",
                        sub_title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "START",
                    });
                } catch (err: any) {
                    socket.emit("logStepDeploy", {
                        log: undefined,
                        title: "deploy",
                        sub_title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                    return false;
                }

                let log;
                socket.emit("logStepDeploy", {
                    log: undefined,
                    title: "deploy",
                    sub_title: `cd ${
                        service!.repo
                    } && docker compose -f ./docker-compose.yaml up --build -d`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                log = await ssh.execCommand(
                    `cd ${
                        service!.repo
                    } && docker compose -f ./docker-compose.yaml up --build -d`,
                    {
                        onStdout(chunk) {
                            // Gửi log mới đến client
                            // console.log(chunk.toString("utf8"));
                            chunk
                                .toString("utf8")
                                .split("\n")
                                .map((l) => {
                                    socket.emit("logRealTimeDeploy", l);
                                });
                        },
                    }
                );

                if (log.code === 0) {
                    socket.emit("logStepDeploy", {
                        log: log,
                        title: "deploy",
                        sub_title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                    return true;
                }
                if (log.code !== 0) {
                    socket.emit("logStepDeploy", {
                        log: log,
                        title: "deploy",
                        sub_title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                    return false;
                }
            }
            return false;
        }
        return false;
    }
    return false;
}
