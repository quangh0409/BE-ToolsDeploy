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
import { SocketServer } from "../utils";
import { Socket } from "socket.io";
import Vms from "../models/vms";
import { v1 } from "uuid";
import jsonwebtoken, { VerifyOptions } from "jsonwebtoken";
import { configs } from "../configs";
import { getExpireTime } from "../middlewares";
import { findTicketByUserId } from "../services/ticket.service";
import logger from "logger";
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
        ssh.dispose();
        const result = new Vms({
            id: v1(),
            host: params.host,
            user: params.user,
            pass: params.pass,
            status: EStatus.CONNECT,
            last_connect: new Date(),
        });
        await result.save();

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
        await result.save();

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

    vms.map((vm) => {
        try {
            const ssh = new NodeSSH();
            ssh.connect({
                host: vm.host,
                username: vm.user,
                password: vm.pass,
            });
            connect.push(vm.id);
        } catch (error) {
            disconnect.push(vm.id);
        }
    });

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
    const ssh = new NodeSSH();
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
                return "7ce28bf0-eac6-11ee-bd50-398fd5d039d1" === id;
            });
            if (check) {
                const ssh = new NodeSSH();

                const vm = await Vms.findOne({
                    id: "7ce28bf0-eac6-11ee-bd50-398fd5d039d1",
                });

                if (!vm) {
                    logger.error(
                        `socket emmit logCheckConnectVM mess: host not exited`
                    );
                    socket.emit("logCheckConnectVM", {
                        mess: "host not exited ",
                        status: "error",
                    });
                }

                // Đọc nội dung của file RSA vào biến privateKey
                const privateKey = fs.readFileSync(file_path).toString();

                try {
                    await ssh.connect({
                        host: "23.102.237.66",
                        username: "quang_vt204299",
                        privateKey: privateKey,
                    });
                    socket.emit("logInstallDocker", {
                        mess: "connect successfull",
                        status: "ok",
                    });
                } catch (err: any) {
                    console.log("🚀 ~ err84:", err);
                    socket.emit("logInstallDocker", {
                        content: err,
                        mess: "connect fialed",
                        status: "error",
                    });
                }
                let log;
                await ssh.execCommand(
                    "mkdir -p docker && touch docker/docker-setup.sh"
                );
                const content = fs.readFileSync(file_path_docker);
                await ssh.execCommand(
                    `echo '${content}' > docker/docker-setup.sh`
                );
                await ssh.execCommand("chmod +x docker/docker-setup.sh");
                log = await ssh.execCommand(
                    `echo "Quangh204299" | sudo -S ./docker/docker-setup.sh`
                );
                socket.emit("logInstallDocker", {
                    log: log,
                    mess: `echo "Quangh204299" | sudo -S ./docker/docker-setup.sh`,
                });
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        "sudo -S usermod -aG docker $USER",
                        { stdin: vm!.pass }
                    );
                    socket.emit("logInstallDocker", {
                        log: log,
                        mess: "sudo usermod -aG docker $USER",
                    });
                }
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        "sudo -S systemctl restart docker",
                        { stdin: vm!.pass }
                    );
                    socket.emit("logInstallDocker", {
                        log: log,
                        mess: "sudo systemctl restart docker",
                    });
                }
                socket.emit("logInstallDocker", {
                    log: log,
                    mess: "successfully",
                });
                ssh.dispose();
            }
        }
    }

    // const sftp = new SftpClient();
    // await sftp.connect({
    //     host: "23.102.237.66",
    //     username: "quang_vt204299",
    //     privateKey: privateKey,
    // });

    // // await sftp.chmod("docker/docker-setup.sh", 0o777);

    // await sftp.put(conent, "docker/docker-setup.sh");

    // return success.ok({ result: "Install Docker Successfull" });
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
                    logger.error(
                        `socket emmit logCheckConnectVM mess: host not exited`
                    );
                    socket.emit("logCheckConnectVM", {
                        mess: "host not exited ",
                        status: "error",
                    });
                }

                // Đọc nội dung của file RSA vào biến privateKey
                const privateKey = fs.readFileSync(file_path).toString();

                try {
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        privateKey: privateKey,
                    });

                    socket.emit("logCheckConnectVM", {
                        mess: "conecct sccessfull ",
                        status: "ok",
                    });
                    ssh.dispose();
                } catch (error: any) {
                    socket.emit("logCheckConnectVM", {
                        mess: error?.level,
                        status: "error",
                    });
                    logger.error(
                        `socket emmit logCheckConnectVM mess: ${error?.level}`
                    );
                }
            }
        }
    }
}

export async function sshCheckConnectDev(): Promise<ResultSuccess> {
    const ssh = new NodeSSH();
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/id_rsa");

    // Đọc nội dung của file RSA vào biến privateKey
    const privateKey = fs.readFileSync(file_path).toString();

    await ssh.connect({
        host: "23.102.228.99",
        username: "gitlab",
        privateKey: privateKey,
    });
    await ssh.execCommand("mkdir -p test ");

    return success.ok({ result: "Connect successfull" });
}

export async function sshInstallDockerDev(): Promise<ResultSuccess> {
    const ssh = new NodeSSH();
    const path = __dirname;
    const file_path = resolve(path, "../../", "file/id_rsa");
    const file_path_docker = resolve(
        path,
        "../../",
        "file/win/docker-setup.sh"
    );

    // Đọc nội dung của file RSA vào biến privateKey
    const privateKey = fs.readFileSync(file_path).toString();
    const content: Buffer = fs.readFileSync(file_path_docker);

    await ssh.connect({
        host: "23.102.228.99",
        username: "gitlab",
        privateKey: privateKey,
        timeout: 300000,
    });
    // await ssh.execCommand("mkdir -p docker && touch docker/docker-setup.sh");
    // // const content = fs.readFileSync(file_path);
    // await ssh.execCommand(`echo '${content}' > docker/docker-setup.sh`);
    // const run = await ssh.execCommand(
    //     "chmod +x docker/docker-setup.sh && cd docker && ./docker-setup.sh"
    // );
    /// SSH
    await ssh.execCommand("sudo apt-get update");

    await ssh.execCommand(
        "sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release"
    );
    await ssh.execCommand(
        "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg"
    );
    await ssh.execCommand(`echo \\
    \"deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \\
    $(lsb_release -cs) stable\\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`);
    await ssh.execCommand("sudo apt-get update");
    await ssh.execCommand(
        "sudo apt-get install -y docker-ce docker-ce-cli containerd.io"
    );
    await ssh.execCommand(
        `sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose`
    );
    await ssh.execCommand("sudo chmod +x /usr/local/bin/docker-compose");

    await ssh.execCommand("sudo usermod -aG docker $USER");
    await ssh.execCommand("sudo systemctl restart docker");

    return success.ok({ result: "successful" });
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
