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
                        title: undefined,
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
                        title: undefined,
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
                        title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "DONE",
                    });
                } catch (err: any) {
                    socket.emit("logStepClone", {
                        log: undefined,
                        title: "ssh connect failed",
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
                    title: `git clone ${
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
                        title: `cd ${service!.repo} && git checkout ${
                            env!.branch
                        }`,
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    socket.emit("logStepClone", {
                        log: log,
                        title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                    return true;
                }
                if (log.code !== 0) {
                    socket.emit("logStepClone", {
                        log: log,
                        title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
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
                    socket.emit("logStepScanDockerfile", {
                        log: undefined,
                        title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                }
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logStepScanDockerfile", {
                        log: undefined,
                        title: undefined,
                        mess: "SERVICE NOT EXITED",
                        status: "ERROR",
                    });
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
                        title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "DONE",
                    });
                } catch (err: any) {
                    socket.emit("logStepScanDockerfile", {
                        log: undefined,
                        title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                }

                let log;

                log = await ssh.execCommand(
                    `hadolint ./${service!.repo}/Dockerfile`
                );
                socket.emit("logStepScanDockerfile", {
                    log: log,
                    title: `hadolint ./${service!.repo}/Dockerfile`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `hadolint ./${service!.repo}/Dockerfile`
                    );
                    socket.emit("logStepScanDockerfile", {
                        log: log,
                        title: `hadolint ./${
                            service!.repo
                        }/docker-compose.yaml`,
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    socket.emit("logStepScanDockerfile", {
                        log: log,
                        title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                }
                if (log.code !== 0) {
                    socket.emit("logStepScanDockerfile", {
                        log: log,
                        title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                }
            }
        }
    }
}

export async function clear(
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
                    socket.emit("logsStepClear", {
                        log: undefined,
                        title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                }
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logsStepClear", {
                        log: undefined,
                        title: undefined,
                        mess: "SERVICE NOT EXITED",
                        status: "ERROR",
                    });
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
                        title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "DONE",
                    });
                } catch (err: any) {
                    socket.emit("logsStepClear", {
                        log: undefined,
                        title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                }

                let log;
                log = await ssh.execCommand(`docker builder prune -f`);
                socket.emit("logsStepClear", {
                    log: log,
                    title: `docker builder prune -f`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                if (log.code === 0) {
                    socket.emit("logsStepClear", {
                        log: log,
                        title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                }
                if (log.code !== 0) {
                    socket.emit("logsStepClear", {
                        log: log,
                        title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                }
            }
        }
    }
}

export async function build(
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
                    socket.emit("logStepBuild", {
                        log: undefined,
                        title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                }
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logStepBuild", {
                        log: undefined,
                        title: undefined,
                        mess: "SERVICE NOT EXITED",
                        status: "ERROR",
                    });
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
                        title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "DONE",
                    });
                } catch (err: any) {
                    socket.emit("logStepBuild", {
                        log: undefined,
                        title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                }

                let log;
                log = await ssh.execCommand(
                    `cd ${
                        service!.repo
                    } && chmod +x ./nginx/entrypoint.sh && chmod +x docker-compose.yaml  && docker compose -f ./docker-compose.yaml build`
                );
                socket.emit("logStepBuild", {
                    log: log,
                    title: `cd ${
                        service!.repo
                    } && chmod +x ./nginx/entrypoint.sh && chmod +x docker-compose.yaml  && docker compose -f ./docker-compose.yaml build`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                if (log.code === 0) {
                    socket.emit("logStepBuild", {
                        log: log,
                        title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                }
                if (log.code !== 0) {
                    socket.emit("logStepBuild", {
                        log: log,
                        title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                }
            }
        }
    }
}

// export async function scanImages(
//     socket: Socket,
//     token: string,
//     vm_id: string,
//     service_id: string,
//     env_name: string
// ) {
//     const payload = await verifyToken(token);
//     const ticket = await findTicketByUserId({ user_id: payload.id });

//     if (ticket.body && ticket.status === 200) {
//         if (ticket.body.vms_ids) {
//             const check = ticket.body.vms_ids.find((id) => {
//                 return vm_id === id;
//             });
//             if (check) {
//                 const ssh = new NodeSSH();

//                 const vm = await Vms.findOne({
//                     id: vm_id,
//                 });

//                 if (!vm) {
//                     socket.emit("logStepScanImage", {
//                         mess: "host not exited ",
//                         status: "ERROR",
//                     });
//                 }

//                 const service = await Service.findOne({ id: service_id });

//                 if (!service) {
//                     socket.emit("logStepScanImage", {
//                         mess: "host not exited ",
//                         status: "ERROR",
//                     });
//                 }

//                 const repo = service!.repo;

//                 const env = service!.environment.find((e) => {
//                     return e.name === env_name;
//                 });
//                 try {
//                     await ssh.connect({
//                         host: vm!.host,
//                         username: vm!.user,
//                         password: vm!.pass,
//                     });

//                     socket.emit("logStepScanImage", {
//                         mess: "conecct sccessfull ",
//                         status: "ok",
//                     });
//                 } catch (error: any) {
//                     socket.emit("logStepScanImage", {
//                         mess: error?.level,
//                         status: "ERROR",
//                     });
//                 }

//                 let log;

//                 log = await ssh.execCommand(
//                     `cd ${
//                         service!.repo
//                     } && docker compose -f ./docker-compose.yaml up --build -d`
//                 );
//                 socket.emit("logStepScanImage", {
//                     log: log,
//                     mess: `cd ${
//                         service!.repo
//                     } && docker compose -f ./docker-compose.yaml up --build -d`,
//                     status: "ok",
//                 });
//             }
//         }
//     }
// }

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
                        title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                }
                const service = await Service.findOne({ id: service_id });

                if (!service) {
                    socket.emit("logStepDeploy", {
                        log: undefined,
                        title: undefined,
                        mess: "SERVICE NOT EXITED",
                        status: "ERROR",
                    });
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
                        title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "DONE",
                    });
                } catch (err: any) {
                    socket.emit("logStepDeploy", {
                        log: undefined,
                        title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                }

                let log;

                log = await ssh.execCommand(
                    `cd ${
                        service!.repo
                    } && docker compose -f ./docker-compose.yaml up --build -d`
                );
                socket.emit("logStepScanImage", {
                    log: log,
                    title: `cd ${
                        service!.repo
                    } && docker compose -f ./docker-compose.yaml up --build -d`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                if (log.code === 0) {
                    socket.emit("logStepScanImage", {
                        log: log,
                        title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                }
                if (log.code !== 0) {
                    socket.emit("logStepScanImage", {
                        log: log,
                        title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                }
            }
        }
    }
}
