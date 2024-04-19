import {
    ErrorDetail,
    HttpError,
    HttpStatus,
    Payload,
    ResultError,
    ResultSuccess,
    error,
    success,
} from "app";
import { resolve } from "path";
import fs from "fs";

import { NodeSSH } from "node-ssh";
import { Socket } from "socket.io";
import Vms from "../models/vms";
import { v1 } from "uuid";
import jsonwebtoken, { VerifyOptions } from "jsonwebtoken";
import { configs } from "../configs";
import { getExpireTime } from "../middlewares";
import { findTicketByUserId } from "../services/ticket.service";
import { EStatus } from "../interfaces/models/vms";

export async function createVms(params: {
    host: string;
    user: string;
    pass: string;
}): Promise<ResultSuccess> {
    const check = await Vms.findOne({ host: params.host });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "body",
                value: params.host,
                message: "Host exited",
            },
        ],
    };
    if (check) {
        throw new HttpError(err);
    }
    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: params.host,
            username: params.user,
            password: params.pass,
        });

        let log;
        log = await ssh.execCommand("hostnamectl");
        let operating_system: string = "";
        let kernel: string = "";
        let architecture: string = "";
        log.stdout.split("\n").map((t) => {
            const ob = t.split(": ");
            if ("Operating System" === ob[0].trim()) {
                operating_system = ob[1];
            }
            if ("Kernel" === ob[0].trim()) {
                kernel = ob[1];
            }
            if ("Architecture" === ob[0].trim()) {
                architecture = ob[1];
            }
        });
        log = await ssh.execCommand("uname -o");
        operating_system += ` ${log.stdout}`;
        log = await ssh.execCommand("cat /etc/os-release");
        let home_url: string = "";
        let support_url: string = "";
        let bug_report_url: string = "";
        let privacy_policy_url: string = "";
        log.stdout.split("\n").map((t) => {
            const ob = t.split("=");
            if ("HOME_URL" === ob[0]) {
                home_url = `${ob[1].replace(/"/g, "")}`;
            } else if ("SUPPORT_URL" === ob[0]) {
                support_url = `${ob[1].replace(/"/g, "")}`;
            } else if ("BUG_REPORT_URL" === ob[0]) {
                bug_report_url = `${ob[1].replace(/"/g, "")}`;
            } else if ("PRIVACY_POLICY_URL" === ob[0]) {
                privacy_policy_url = `${ob[1].replace(/"/g, "")}`;
            }
        });
        log = await ssh.execCommand("landscape-sysinfo");
        let lines = log.stdout.split("\n");
        let obj: { [key: string]: string } = {};
        lines.forEach((line) => {
            let parts = line.split(/\s{2,}/);
            console.log("🚀 ~ lines.forEach ~ parts:", parts)
            parts.forEach((part) => {
                let [key, value] = part.split(": ");
                if (key && value) {
                    obj[key] = value;
                }
            });
        });

        console.log(obj);
        /**
         *  hostnamectl
                Operating System: Ubuntu 22.04.4 LTS
                Kernel: Linux 6.5.0-1018-azure
                Architecture: x86-64
            uname -o operating-system 
                GNU/Linux
             cat /etc/os-release
                HOME_URL="https://www.ubuntu.com/"
                SUPPORT_URL="https://help.ubuntu.com/"
                BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
                PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"

            landscape-sysinfo
                  System load:  0.0               Processes:                106
                    Usage of /:   5.4% of 61.84GB   Users logged in:          1
                    Memory usage: 39%               IPv4 address for docker0: 172.17.0.1
                    Swap usage:   0%                IPv4 address for eth0:    10.1.1.4


         */

        ssh.dispose();
        const result = new Vms({
            id: v1(),
            host: params.host,
            user: params.user,
            pass: params.pass,
            status: EStatus.CONNECT,
            last_connect: new Date(),
            operating_system: operating_system,
            kernel: kernel,
            architecture: architecture,
            home_url: home_url,
            support_url: support_url,
            bug_report_url: bug_report_url,
            privacy_policy_url: privacy_policy_url,
        });
        // await result.save();

        return success.ok({
            ...result.toJSON(),
            pass: undefined,
            _id: undefined,
        });
    } catch (err) {
        const result = new Vms({
            id: v1(),
            host: params.host,
            user: params.user,
            pass: params.pass,
            status: EStatus.DISCONNECT,
            last_connect: new Date(),
        });
        // await result.save();

        throw new HttpError(
            error.notFound({
                message: "wrong user or pass",
            })
        );
    }
}

export async function getVmsByIds(params: {
    ids: string[];
}): Promise<ResultSuccess> {
    let connect: string[] = [];
    let disconnect: string[] = [];

    const vms = await Vms.aggregate([
        {
            $match: {
                id: {
                    $in: [...params.ids],
                },
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
    ]);

    async function connectSSH(vm: {
        host: any;
        user: any;
        pass: any;
        id: any;
    }) {
        const ssh = new NodeSSH();
        try {
            await ssh.connect({
                host: vm.host,
                username: vm.user,
                password: vm.pass,
            });
            return vm.id; // Return vm.id if connection is successful
        } catch (error) {
            return null; // Return null if connection fails
        } finally {
            ssh.dispose(); // Close the SSH connection
        }
    }

    await Promise.all(
        vms.map(async (vm) => {
            const id = await connectSSH(vm);
            if (id) {
                connect.push(id);
            } else {
                disconnect.push(vm.id);
            }
        })
    );

    const [con, dis] = await Promise.all([
        Vms.updateMany(
            {
                id: {
                    $in: [...connect],
                },
            },
            {
                $set: {
                    status: EStatus.CONNECT,
                },
            }
        ),
        Vms.updateMany(
            {
                id: {
                    $in: [...disconnect],
                },
            },
            {
                $set: {
                    status: EStatus.DISCONNECT,
                },
            }
        ),
    ]);
    console.log("🚀 ~ con, dis:", con, dis);

    const result = await Vms.aggregate([
        {
            $match: {
                id: {
                    $in: [...params.ids],
                },
            },
        },
        {
            $project: {
                _id: 0,
                pass: 0,
            },
        },
    ]);

    return success.ok(result);
}

export async function updateVms(params: {
    id: string;
    last_connect?: Date;
    user?: string;
    pass?: string;
}): Promise<ResultSuccess> {
    const vm = await Vms.aggregate([
        {
            $match: {
                id: params.id,
            },
        },
        {
            $set: {
                user: params.user,
                pass: params.pass,
                last_connect: params.last_connect,
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
    ]);

    if (!vm) {
        throw new HttpError(
            error.notFound({
                param: "id",
                value: params.id,
            })
        );
    }

    return success.ok(vm);
}

export async function sshInstallDocker(
    socket: Socket,
    token: string,
    vm_id: string
) {
    const payload = await verifyToken(token);
    const ticket = await findTicketByUserId({ user_id: payload.id });
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/win/id_rsa");
    const file_path_docker = resolve(
        path,
        "../../",
        "file/win/docker-setup.sh"
    );

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
                    socket.emit("logCheckConnectVM", {
                        log: undefined,
                        title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                }

                // Đọc nội dung của file RSA vào biến privateKey
                const privateKey = fs.readFileSync(file_path).toString();

                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });
                    socket.emit("logInstallDocker", {
                        log: undefined,
                        title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "DONE",
                    });
                } catch (err: any) {
                    socket.emit("logInstallDocker", {
                        log: undefined,
                        title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                }
                let log;
                await ssh.execCommand(
                    "mkdir -p docker && touch docker/docker-setup.sh"
                );
                const content = fs.readFileSync(file_path_docker);
                await ssh.execCommand(
                    `echo '${content}' | tr -d '\r' > docker/docker-setup.sh`
                );
                await ssh.execCommand("chmod +x docker/docker-setup.sh");
                log = await ssh.execCommand(
                    `echo "${vm!.pass}" | sudo -S ./docker/docker-setup.sh`
                );
                socket.emit("logInstallDocker", {
                    log: log,
                    title: "sudo ./docker/docker-setup.sh",
                    mess: undefined,
                    status: "IN_PROGRESS",
                });
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `echo "${vm!.pass}" | sudo -S usermod -aG docker $USER`
                    );
                    socket.emit("logInstallDocker", {
                        log: log,
                        title: "sudo usermod -aG docker $USER",
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `echo "${vm!.pass}" | sudo -S systemctl restart docker`
                    );
                    socket.emit("logInstallDocker", {
                        log: log,
                        title: "sudo systemctl restart docker",
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    socket.emit("logInstallDocker", {
                        log: log,
                        title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                } else {
                    socket.emit("logInstallDocker", {
                        log: log,
                        title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                }
                ssh.dispose();
            }
        }
    }
}

export async function sshCheckConnect(
    socket: Socket,
    token: string,
    vm_id: string
) {
    const payload = await verifyToken(token);
    const ticket = await findTicketByUserId({ user_id: payload.id });
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/win/id_rsa");

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
                    socket.emit("logCheckConnectVM", {
                        log: undefined,
                        title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                }

                // Đọc nội dung của file RSA vào biến privateKey
                const privateKey = fs.readFileSync(file_path).toString();

                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });

                    socket.emit("logCheckConnectVM", {
                        log: undefined,
                        title: "ssh",
                        sub_title: "ssh connect successfully",
                        mess: "CONNECT_SUCCESSFULLY",
                        status: "DONE",
                    });
                    ssh.dispose();
                } catch (error: any) {
                    socket.emit("logCheckConnectVM", {
                        log: undefined,
                        title: "ssh",
                        sub_title: "ssh connect failed",
                        mess: error?.level,
                        status: "ERROR",
                    });
                    ssh.dispose();
                }
            }
        }
    }
}

export async function sshInstallTrivy(
    socket: Socket,
    token: string,
    vm_id: string
) {
    const payload = await verifyToken(token);
    const ticket = await findTicketByUserId({ user_id: payload.id });
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/win/id_rsa");
    if (ticket.body && ticket.status === 200) {
        if (ticket.body.vms_ids) {
            const check = ticket.body.vms_ids.find((id) => {
                return vm_id === id;
            });
            console.log("🚀 ~ check ~ check:", check);
            if (check) {
                const ssh = new NodeSSH();

                const vm = await Vms.findOne({
                    id: vm_id,
                });

                if (!vm) {
                    socket.emit("logInstallTrivy", {
                        log: undefined,
                        title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                }

                // Đọc nội dung của file RSA vào biến privateKey
                const privateKey = fs.readFileSync(file_path).toString();

                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });

                    socket.emit("logInstallTrivy", {
                        log: undefined,
                        title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "DONE",
                    });
                } catch (err: any) {
                    socket.emit("logInstallTrivy", {
                        log: undefined,
                        title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                }
                await ssh.execCommand("mkdir -p trivy");
                let log;
                log = await ssh.execCommand(
                    `echo "${vm!.pass}" | sudo -S apt-get install -y wget`
                );
                socket.emit("logInstallTrivy", {
                    log: log,
                    title: `sudo apt-get install -y wget`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });

                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd trivy && wget https://github.com/aquasecurity/trivy/releases/download/v0.50.1/trivy_0.50.1_Linux-64bit.tar.gz`
                    );
                    socket.emit("logInstallTrivy", {
                        log: log,
                        title: `wget https://github.com/aquasecurity/trivy/releases/download/v0.50.1/trivy_0.50.1_Linux-64bit.tar.gz`,
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd trivy && tar zxvf trivy_0.50.1_Linux-64bit.tar.gz`
                    );
                    socket.emit("logInstallTrivy", {
                        log: log,
                        title: `cd trivy && tar zxvf trivy_0.50.1_Linux-64bit.tar.gz`,
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd trivy && echo "${
                            vm!.pass
                        }" | sudo -S mv trivy /usr/local/bin/`
                    );
                    socket.emit("logInstallTrivy", {
                        log: log,
                        title: `cd trivy && mv trivy /usr/local/bin/`,
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    socket.emit("logInstallTrivy", {
                        log: log,
                        title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                }
                if (log.code !== 0) {
                    socket.emit("logInstallTrivy", {
                        log: log,
                        title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                }
                ssh.dispose();
            } else {
                throw new HttpError(
                    error.invalidData({
                        message: "id vm not found",
                    })
                );
            }
        }
    } else {
        throw new HttpError(
            error.invalidData({
                message: "token have problem",
            })
        );
    }
}

export async function sshInstallHadolint(
    socket: Socket,
    token: string,
    vm_id: string
) {
    const payload = await verifyToken(token);
    const ticket = await findTicketByUserId({ user_id: payload.id });
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/win/id_rsa");
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
                    socket.emit("logInstallHadolint", {
                        log: undefined,
                        title: undefined,
                        mess: "HOST NOT EXITED",
                        status: "ERROR",
                    });
                }

                // Đọc nội dung của file RSA vào biến privateKey
                const privateKey = fs.readFileSync(file_path).toString();

                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                    });

                    socket.emit("logInstallHadolint", {
                        log: undefined,
                        title: "ssh connect successfully",
                        mess: "CONNECT SUCCESSFULLY",
                        status: "DONE",
                    });
                } catch (err: any) {
                    socket.emit("logInstallHadolint", {
                        log: undefined,
                        title: "ssh connect failed",
                        mess: err?.level,
                        status: "ERROR",
                    });
                }
                await ssh.execCommand("mkdir -p hadolint");
                let log;
                log = await ssh.execCommand(
                    `cd hadolint && wget https://github.com/hadolint/hadolint/releases/download/v2.7.0/hadolint-Linux-x86_64`
                );
                socket.emit("logInstallHadolint", {
                    log: log,
                    title: `wget https://github.com/hadolint/hadolint/releases/download/v2.7.0/hadolint-Linux-x86_64`,
                    mess: undefined,
                    status: "IN_PROGRESS",
                });

                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd hadolint && echo "${
                            vm!.pass
                        }" | sudo -S mv hadolint-Linux-x86_64 hadolint`
                    );
                    socket.emit("logInstallHadolint", {
                        log: log,
                        title: `sudo mv hadolint-Linux-x86_64 hadolint`,
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd hadolint && chmod +x hadolint`
                    );
                    socket.emit("logInstallHadolint", {
                        log: log,
                        title: `cd hadolint && chmod +x hadolint`,
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd hadolint && echo "${
                            vm!.pass
                        }" | sudo -S mv hadolint /usr/local/bin/`
                    );
                    socket.emit("logInstallHadolint", {
                        log: log,
                        title: `sudo mv hadolint /usr/local/bin/`,
                        mess: undefined,
                        status: "IN_PROGRESS",
                    });
                }
                if (log.code === 0) {
                    socket.emit("logInstallHadolint", {
                        log: log,
                        title: undefined,
                        mess: "SUCCESSFULLY",
                        status: "SUCCESSFULLY",
                    });
                }
                if (log.code !== 0) {
                    socket.emit("logInstallHadolint", {
                        log: log,
                        title: undefined,
                        mess: "ERROR",
                        status: "ERROR",
                    });
                }
                ssh.dispose();
            } else {
                throw new HttpError(
                    error.invalidData({
                        message: "id vm not found",
                    })
                );
            }
        }
    } else {
        throw new HttpError(
            error.invalidData({
                message: "token have problem",
            })
        );
    }
}

export async function verifyToken(token: string): Promise<Payload> {
    const option = { algorithm: "RS256" } as VerifyOptions;
    const errors: ErrorDetail[] = [
        {
            param: "token",
            location: "header",
            value: token,
        },
    ];
    if (!token) {
        throw new HttpError({
            status: HttpStatus.UNAUTHORIZED,
            code: "NO_TOKEN",
            errors: errors,
        });
    }

    try {
        const publicKey = configs.keys.public;
        const payload = <Payload>jsonwebtoken.verify(token, publicKey, option);
        const expireAt = await getExpireTime({
            token,
            userId: payload.id,
        });
        if (payload.type !== "ACCESS_TOKEN" || expireAt === null) {
            throw new HttpError({
                status: HttpStatus.UNAUTHORIZED,
                code: "INVALID_TOKEN",
                errors: errors,
            });
        }

        return payload;
    } catch (error) {
        const e: Error = error as Error;
        if (e.name && e.name === "TokenExpiredError") {
            throw new HttpError({
                status: HttpStatus.UNAUTHORIZED,
                code: "TOKEN_EXPIRED",
                errors: errors,
            });
        } else {
            throw new HttpError({
                status: HttpStatus.UNAUTHORIZED,
                code: "INVALID_TOKEN",
                errors: errors,
            });
        }
    }
}
