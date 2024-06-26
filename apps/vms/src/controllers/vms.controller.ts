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
import {
    deleteVmsOfTicketById,
    findTicketByUserId,
} from "../services/ticket.service";
import { EStatus } from "../interfaces/models/vms";
import Service from "../models/service";

export async function createVms(params: {
    host: string;
    user: string;
    pass: string;
    standard: string;
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
            port: 22,
            tryKeyboard: true,
        });

        let log;
        log = await ssh.execCommand("hostnamectl");
        let operating_system = "";
        let kernel = "";
        let architecture = "";
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
        let home_url = "";
        let support_url = "";
        let bug_report_url = "";
        let privacy_policy_url = "";
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
        const obj: { [key: string]: string } = {};
        const regex = /([\w\s\/]+):\s*([^\n]+?)(?=\s{2,}[\w\s\/]+:|$)/g;
        let match;

        while ((match = regex.exec(log.stdout)) !== null) {
            const key = match[1].trim().replace(/\s+/g, " "); // Normalize whitespace in keys
            const value = match[2].trim();
            // Handle cases where multiple entries might be on the same line
            if (value.includes("   ")) {
                const parts = value.split("   ").map((part) => part.trim());
                let lastKey = key;
                parts.forEach((part, index) => {
                    if (index === 0) {
                        obj[lastKey] = part;
                    } else {
                        const newSplit = part.split(": ");
                        lastKey = newSplit[0].trim().replace(/\s+/g, " ");
                        obj[lastKey] = newSplit[1]?.trim();
                    }
                });
            } else {
                obj[key] = value;
            }
        }
        log = await ssh.execCommand(`lscpu | grep '^CPU(s):'`);
        const cpus = log.stdout.split(/\s{2,}/g)[1];
        log = await ssh.execCommand(`lscpu | grep 'Socket(s)'`);
        const sockets = log.stdout.split(/\s{2,}/g)[1];
        log = await ssh.execCommand(`lscpu | grep 'Core(s) per socket'`);
        const cores = `${
            Number.parseInt(log.stdout.split(/\s{2,}/g)[1]) *
            Number.parseInt(sockets)
        }`;
        log = await ssh.execCommand(`lscpu | grep 'Thread(s) per core'`);
        const thread = `${
            Number.parseInt(log.stdout.split(/\s{2,}/g)[1]) *
            Number.parseInt(cores)
        }`;
        log = await ssh.execCommand(`free --giga | awk '/Mem/{print $2}'`);
        let ram;
        if (log.stdout === "0") {
            log = await ssh.execCommand(`free -m | awk '/Mem/{print $2}'`);
            ram = `${log.stdout}MB`;
        } else {
            ram = `${log.stdout}GB`;
        }
        const set_up: {
            docker: string;
            hadolint: string;
            trivy: string;
        } = {
            docker: "",
            hadolint: "",
            trivy: "",
        };
        log = await ssh.execCommand(`hadolint --version`);
        if (log.code === 0) {
            set_up.hadolint = log.stdout;
        }
        log = await ssh.execCommand(`trivy -v`);
        if (log.code === 0) {
            set_up.trivy = log.stdout.split("\n")[0];
        }
        log = await ssh.execCommand(`docker --version`);
        if (log.code === 0) {
            set_up.docker = log.stdout;
        }

        ssh.dispose();
        const result = new Vms({
            id: v1(),
            host: params.host,
            user: params.user,
            pass: params.pass,
            standard: params.standard,
            status: EStatus.CONNECT,
            last_connect: new Date(),
            operating_system: operating_system,
            kernel: kernel,
            architecture: architecture,
            home_url: home_url,
            support_url: support_url,
            bug_report_url: bug_report_url,
            privacy_policy_url: privacy_policy_url,
            cpus: cpus,
            cores: cores,
            sockets: sockets,
            ram: ram,
            thread: thread,
            set_up: set_up,
        });
        await result.save();

        return success.ok({
            ...result.toJSON(),
            pass: undefined,
            _id: undefined,
            landscape_sysinfo: obj,
        });
    } catch (err) {
        console.log("🚀 ~ err:", err);
        const result = new Vms({
            id: v1(),
            host: params.host,
            user: params.user,
            pass: params.pass,
            status: EStatus.DISCONNECT,
            last_connect: new Date(),
        });
        await result.save();

        return success.ok({
            ...result.toJSON(),
            pass: undefined,
            _id: undefined,
        });
    }
}

export async function getSysinfoOfVms(params: {
    vms: string;
}): Promise<ResultSuccess> {
    const check = await Vms.findOne({ id: params.vms });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "params",
                value: params.vms,
                message: "Vms not exit",
            },
        ],
    };
    if (!check) {
        throw new HttpError(err);
    }
    const ssh = new NodeSSH();

    await ssh.connect({
        host: check.host,
        username: check.user,
        password: check.pass,
        port: 22,
        tryKeyboard: true,
    });

    let log;
    log = await ssh.execCommand("landscape-sysinfo");
    const obj: { [key: string]: string } = {};
    const regex = /([\w\s\/]+):\s*([^\n]+?)(?=\s{2,}[\w\s\/]+:|$)/g;
    let match;

    while ((match = regex.exec(log.stdout)) !== null) {
        const key = match[1].trim().replace(/\s+/g, " "); // Normalize whitespace in keys
        const value = match[2].trim();
        // Handle cases where multiple entries might be on the same line
        if (value.includes("   ")) {
            const parts = value.split("   ").map((part) => part.trim());
            let lastKey = key;
            parts.forEach((part, index) => {
                if (index === 0) {
                    obj[lastKey] = part;
                } else {
                    const newSplit = part.split(": ");
                    lastKey = newSplit[0].trim().replace(/\s+/g, " ");
                    obj[lastKey] = newSplit[1]?.trim();
                }
            });
        } else {
            obj[key] = value;
        }
    }

    return success.ok(obj);
}

export async function getVmsById(params: {
    vms: string;
}): Promise<ResultSuccess> {
    const check = await Vms.findOne({ id: params.vms });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "params",
                value: params.vms,
                message: "Vms not exit",
            },
        ],
    };
    if (!check) {
        throw new HttpError(err);
    }

    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: check.host,
            username: check.user,
            password: check.pass,
            port: 22,
            tryKeyboard: true,
        });

        let log;
        log = await ssh.execCommand("landscape-sysinfo");
        const obj: { [key: string]: string } = {};
        const regex = /([\w\s\/]+):\s*([^\n]+?)(?=\s{2,}[\w\s\/]+:|$)/g;
        let match;

        while ((match = regex.exec(log.stdout)) !== null) {
            const key = match[1].trim().replace(/\s+/g, " "); // Normalize whitespace in keys
            const value = match[2].trim();
            // Handle cases where multiple entries might be on the same line
            if (value.includes("   ")) {
                const parts = value.split("   ").map((part) => part.trim());
                let lastKey = key;
                parts.forEach((part, index) => {
                    if (index === 0) {
                        obj[lastKey] = part;
                    } else {
                        const newSplit = part.split(": ");
                        lastKey = newSplit[0].trim().replace(/\s+/g, " ");
                        obj[lastKey] = newSplit[1]?.trim();
                    }
                });
            } else {
                obj[key] = value;
            }
        }

        const set_up: {
            docker: string;
            hadolint: string;
            trivy: string;
        } = {
            docker: "",
            hadolint: "",
            trivy: "",
        };
        log = await ssh.execCommand(`hadolint --version`);
        if (log.code === 0) {
            set_up.hadolint = log.stdout;
        }
        log = await ssh.execCommand(`trivy -v`);
        if (log.code === 0) {
            set_up.trivy = log.stdout.split("\n")[0];
        }
        log = await ssh.execCommand(`docker --version`);
        if (log.code === 0) {
            set_up.docker = log.stdout;
        }

        check.set_up = set_up;

        await check.save();

        return success.ok({
            ...check.toJSON(),
            _id: undefined,
            landscape_sysinfo: obj,
        });
    } catch (error) {
        return success.ok({
            ...check.toJSON(),
            _id: undefined,
        });
    }
}

export async function findContaninersOfVmById(params: {
    vms: string;
    name?: string;
}): Promise<ResultSuccess> {
    const check = await Vms.findOne({ id: params.vms });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "params",
                value: params.vms,
                message: "Vms not exit",
            },
        ],
    };
    if (!check) {
        throw new HttpError(err);
    }

    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: check.host,
            username: check.user,
            password: check.pass,
            port: 22,
            tryKeyboard: true,
        });

        let log;
        let containers: any[] = [];
        let command = "docker stats --format json --no-stream";

        log = await ssh.execCommand(command);
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

        if (params.name) {
            containers_ = containers_.filter((container) => {
                if (container?.Name?.includes(params.name)) {
                    return container;
                }
            });
        }

        return success.ok(containers_);
    } catch (error) {
        console.log("🚀 ~ error:", error);
        return success.ok([]);
    }
}

export async function actionsContainerByByVmsIdAndContainerId(params: {
    vms: string;
    containerId: string;
    action: string;
}): Promise<ResultSuccess> {
    const check = await Vms.findOne({ id: params.vms });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "params",
                value: params.vms,
                message: "Vms not exit",
            },
        ],
    };
    if (!check) {
        throw new HttpError(err);
    }

    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: check.host,
            username: check.user,
            password: check.pass,
            port: 22,
            tryKeyboard: true,
        });

        let log;
        let containers: any[] = [];

        let command = "";

        if (params.action === "stop") {
            command = `docker stop ${params.containerId}`;
        } else if (params.action === "restart") {
            command = `docker restart ${params.containerId}`;
        } else if (params.action === "delete") {
            command = `docker rm -f ${params.containerId}`;
        }

        log = await ssh.execCommand(command);

        command = "docker stats --format json --no-stream";

        log = await ssh.execCommand(command);
        if (log.stdout !== "") {
            containers = log.stdout.split("\n").map((r) => JSON.parse(r));
        }

        command = "docker ps -a --format json";
        log = await ssh.execCommand(command);
        let containers_: any[] = [];
        if (log.stdout !== "") {
            containers_ = log.stdout.split("\n").map((r) => JSON.parse(r));

            containers_ = containers_.map((container_, idx) => {
                console.log("🚀 ~ containers_=containers_.map ~ container_:", container_)
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

        return success.ok(containers_);
    } catch (error) {
        console.log("🚀 ~ error:", error);
        return success.ok([]);
    }
}

export async function findImagesOfVmById(params: {
    vms: string;
    name?: string;
}): Promise<ResultSuccess> {
    const check = await Vms.findOne({ id: params.vms });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "params",
                value: params.vms,
                message: "Vms not exit",
            },
        ],
    };
    if (!check) {
        throw new HttpError(err);
    }

    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: check.host,
            username: check.user,
            password: check.pass,
            port: 22,
            tryKeyboard: true,
        });

        let images = [];
        const log = await ssh.execCommand(`docker images --format json`);

        if (log.stdout !== "") {
            images = log.stdout.split("\n").map((r) => JSON.parse(r));
        }

        images = images.filter((image) => {
            if (!image?.Repository?.includes("<none>")) {
                return image;
            }
        });

        if (params.name) {
            images = images.filter((image) => {
                if (image?.Repository?.includes(params.name)) {
                    return image;
                }
            });
        }

        return success.ok(images);
    } catch (error) {
        console.log("🚀 ~ error:", error);
        return success.ok([]);
    }
}

export async function actionsImagesOfVmById(params: {
    vms: string;
    imnageId: string;
}): Promise<ResultSuccess> {
    const check = await Vms.findOne({ id: params.vms });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "params",
                value: params.vms,
                message: "Vms not exit",
            },
        ],
    };
    if (!check) {
        throw new HttpError(err);
    }

    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: check.host,
            username: check.user,
            password: check.pass,
            port: 22,
            tryKeyboard: true,
        });

        let images = [];
        let command = "";
        let log;
        let message;
        let code;
        command = `docker rmi -f ${params.imnageId}`;
        log = await ssh.execCommand(command);

        console.log("🚀 ~ log:", log);
        if (log.code == 0) {
            message = log.stdout;
        } else {
            message = log.stderr;
        }
        code = log.code;

        log = await ssh.execCommand(`docker images --format json`);

        if (log.stdout !== "") {
            images = log.stdout.split("\n").map((r) => JSON.parse(r));
        }

        images = images.filter((image) => {
            if (!image?.Repository?.includes("<none>")) {
                return image;
            }
        });

        return success.ok({
            message: message,
            code: code,
            images: images,
        });
    } catch (error) {
        console.log("🚀 ~ error:", error);
        return success.ok([]);
    }
}

export async function getVmsByIds(params: {
    ids: string[];
    host?: string;
}): Promise<ResultSuccess> {
    const connect: {
        id: any;
        containers: string | null;
        images: string | null;
    }[] = [];
    const disconnect: {
        id: any;
        containers: string | null;
        images: string | null;
    }[] = [];

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
                port: 22,
                tryKeyboard: true,
            });
            let command = "docker ps -q | wc -l";
            const log1 = await ssh.execCommand(command);
            command =
                "docker images --format '{{.Repository}}' | grep -v '<none>' | wc -l";
            const log2 = await ssh.execCommand(command);
            return { id: vm.id, containers: log1.stdout, images: log2.stdout }; // Return vm.id if connection is successful
        } catch (error) {
            return { id: vm.id, containers: null, images: null }; // Return null if connection fails
        } finally {
            ssh.dispose(); // Close the SSH connection
        }
    }

    await Promise.all(
        vms.map(async (vm) => {
            const res = await connectSSH(vm);
            if (res.containers) {
                connect.push(res);
            } else {
                disconnect.push(res);
            }
        })
    );

    const [con, dis] = await Promise.all([
        Vms.updateMany(
            {
                id: {
                    $in: [...connect.map((res) => res.id)],
                },
            },
            {
                $set: {
                    status: EStatus.CONNECT,
                    last_connect: new Date(),
                },
            }
        ),
        Vms.updateMany(
            {
                id: {
                    $in: [...disconnect.map((res) => res.id)],
                },
            },
            {
                $set: {
                    status: EStatus.DISCONNECT,
                    last_connect: new Date(),
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
                host: {
                    $regex: `${params.host}`,
                    $options: "i",
                },
            },
        },
        {
            $project: {
                _id: 0,
                pass: 0,
            },
        },
    ]).then((res) => {
        const data = res;

        for (let i = 0; i < data.length; i++) {
            const check = connect.find((v) => v.id === data[i].id);
            if (check) {
                Object.assign(data[i], {
                    containers: check.containers,
                    images: check.images,
                });
            }
        }

        return data;
    });

    return success.ok(result);
}

export async function findVmsByHost(params: {
    host: string;
}): Promise<ResultSuccess> {
    const hosts = await Vms.find(
        {
            host: {
                $regex: `${params.host}`,
                $options: "i",
            },
        },
        {
            _id: 0,
        }
    );

    return success.ok(hosts);
}

export async function updateVms(params: {
    id: string;
    user: string;
    pass: string;
}): Promise<ResultSuccess> {
    const vm = await Vms.findOneAndUpdate(
        { id: params.id },
        {
            $set: {
                user: params.user,
                pass: params.pass,
            },
        },
        {
            new: true,
        }
    );

    if (!vm) {
        throw new HttpError(
            error.notFound({
                param: "id",
                value: params.id,
            })
        );
    }

    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: vm.host,
            username: params.user,
            password: params.pass,
            port: 22,
            tryKeyboard: true,
        });

        let log;
        log = await ssh.execCommand("hostnamectl");
        let operating_system = "";
        let kernel = "";
        let architecture = "";
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
        let home_url = "";
        let support_url = "";
        let bug_report_url = "";
        let privacy_policy_url = "";
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
        const obj: { [key: string]: string } = {};
        const regex = /([\w\s\/]+):\s*([^\n]+?)(?=\s{2,}[\w\s\/]+:|$)/g;
        let match;

        while ((match = regex.exec(log.stdout)) !== null) {
            const key = match[1].trim().replace(/\s+/g, " "); // Normalize whitespace in keys
            const value = match[2].trim();
            // Handle cases where multiple entries might be on the same line
            if (value.includes("   ")) {
                const parts = value.split("   ").map((part) => part.trim());
                let lastKey = key;
                parts.forEach((part, index) => {
                    if (index === 0) {
                        obj[lastKey] = part;
                    } else {
                        const newSplit = part.split(": ");
                        lastKey = newSplit[0].trim().replace(/\s+/g, " ");
                        obj[lastKey] = newSplit[1]?.trim();
                    }
                });
            } else {
                obj[key] = value;
            }
        }
        log = await ssh.execCommand(`lscpu | grep '^CPU(s):'`);
        const cpus = log.stdout.split(/\s{2,}/g)[1];
        log = await ssh.execCommand(`lscpu | grep 'Socket(s)'`);
        const sockets = log.stdout.split(/\s{2,}/g)[1];
        log = await ssh.execCommand(`lscpu | grep 'Core(s) per socket'`);
        const cores = `${
            Number.parseInt(log.stdout.split(/\s{2,}/g)[1]) *
            Number.parseInt(sockets)
        }`;
        log = await ssh.execCommand(`lscpu | grep 'Thread(s) per core'`);
        const thread = `${
            Number.parseInt(log.stdout.split(/\s{2,}/g)[1]) *
            Number.parseInt(cores)
        }`;
        log = await ssh.execCommand(`free --giga | awk '/Mem/{print $2}'`);
        let ram;
        if (log.stdout === "0") {
            log = await ssh.execCommand(`free -m | awk '/Mem/{print $2}'`);
            ram = `${log.stdout}MB`;
        } else {
            ram = `${log.stdout}GB`;
        }
        const set_up: {
            docker: string;
            hadolint: string;
            trivy: string;
        } = {
            docker: "",
            hadolint: "",
            trivy: "",
        };
        log = await ssh.execCommand(`hadolint --version`);
        if (log.code === 0) {
            set_up.hadolint = log.stdout;
        }
        log = await ssh.execCommand(`trivy -v`);
        if (log.code === 0) {
            set_up.trivy = log.stdout.split("\n")[0];
        }
        log = await ssh.execCommand(`docker --version`);
        if (log.code === 0) {
            set_up.docker = log.stdout;
        }

        ssh.dispose();
        const result = await Vms.findOneAndUpdate(
            {
                id: params.id,
            },
            {
                $set: {
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
                    cpus: cpus,
                    cores: cores,
                    sockets: sockets,
                    ram: ram,
                    thread: thread,
                    set_up: set_up,
                },
            },
            {
                new: true,
            }
        );

        return success.ok({
            ...result!.toJSON(),
            _id: undefined,
            landscape_sysinfo: obj,
        });
    } catch (err) {
        console.log("🚀 ~ err:", err);
        return success.ok({
            ...vm.toJSON(),
            _id: undefined,
        });
    }
}

export async function deleteVmsById(params: {
    vms: string;
    ticket: string;
}): Promise<ResultSuccess> {
    const check = await Vms.findOne({ id: params.vms });
    const err: ResultError = {
        status: HttpStatus.BAD_REQUEST,
        errors: [
            {
                location: "params",
                value: params.vms,
                message: "Vms not exit",
            },
        ],
    };
    if (!check) {
        throw new HttpError(err);
    }

    const result = await Vms.deleteOne({ id: params.vms });

    const isDelete = await deleteVmsOfTicketById({
        ticket: params.ticket,
        vm: params.vms,
    });
    if (isDelete.body?.isDelete && result.deletedCount === 1) {
        return success.ok({ message: "deleted successfully" });
    }
    return success.ok({ message: "deleted fail" });
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
                        port: 22,
                        tryKeyboard: true,
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
                log = await ssh.execCommand(`docker --version`);
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

export async function installDocker(params: {
    user_id: string;
    vm_id: string;
}): Promise<ResultSuccess> {
    try {
        const ticket = await findTicketByUserId({ user_id: params.user_id });
        const path = __dirname;
        const file_path_docker = resolve(
            path,
            "../../",
            "file/win/docker-setup.sh"
        );
        if (ticket.body && ticket.status === 200) {
            if (ticket.body.vms_ids) {
                const check = ticket.body.vms_ids.find((id) => {
                    return params.vm_id === id;
                });
                if (check) {
                    const ssh = new NodeSSH();

                    const vm = await Vms.findOne({
                        id: params.vm_id,
                    });

                    if (!vm) {
                        throw error.notFound({
                            location: "params",
                            param: "vm",
                            value: params.vm_id,
                            message: "HOST NOT EXITED",
                        });
                    }
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                        port: 22,
                        tryKeyboard: true,
                    });
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
                    if (log.code === 0) {
                        log = await ssh.execCommand(
                            `echo "${
                                vm!.pass
                            }" | sudo -S usermod -aG docker $USER`
                        );
                    }
                    if (log.code === 0) {
                        log = await ssh.execCommand(
                            `echo "${
                                vm!.pass
                            }" | sudo -S systemctl restart docker`
                        );
                    }
                    log = await ssh.execCommand(`docker --version`);
                    ssh.dispose();
                    if (log.code === 0) {
                        return success.ok({ message: "SUCCESSFULLY" });
                    } else {
                        return success.ok({ message: "FAILED", value: log });
                    }
                }
            }
        }
        throw error.notFound({
            message: "ticket not found",
        });
    } catch (err: any) {
        throw error.notFound({
            value: err,
        });
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
                        port: 22,
                        tryKeyboard: true,
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
                        port: 22,
                        tryKeyboard: true,
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

                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd trivy && wget https://github.com/aquasecurity/trivy/releases/download/v0.50.1/trivy_0.50.1_Linux-64bit.tar.gz`
                    );
                }
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd trivy && tar zxvf trivy_0.50.1_Linux-64bit.tar.gz`
                    );
                }
                if (log.code === 0) {
                    log = await ssh.execCommand(
                        `cd trivy && echo "${
                            vm!.pass
                        }" | sudo -S mv trivy /usr/local/bin/`
                    );
                }
                log = await ssh.execCommand(`trivy -v`);
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

export async function installTrivy(params: {
    user_id: string;
    vm_id: string;
}): Promise<ResultSuccess> {
    try {
        const ticket = await findTicketByUserId({ user_id: params.user_id });
        const path = __dirname;
        const file_path = resolve(path, "../../", "file/win/id_rsa");
        if (ticket.body && ticket.status === 200) {
            if (ticket.body.vms_ids) {
                const check = ticket.body.vms_ids.find((id) => {
                    return params.vm_id === id;
                });
                if (check) {
                    const ssh = new NodeSSH();

                    const vm = await Vms.findOne({
                        id: params.vm_id,
                    });

                    if (!vm) {
                        throw error.notFound({
                            location: "params",
                            param: "vm",
                            value: params.vm_id,
                            message: "HOST NOT EXITED",
                        });
                    }

                    // Đọc nội dung của file RSA vào biến privateKey
                    const privateKey = fs.readFileSync(file_path).toString();
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                        port: 22,
                        tryKeyboard: true,
                    });
                    await ssh.execCommand("mkdir -p trivy");
                    let log;
                    log = await ssh.execCommand(
                        `echo "${vm!.pass}" | sudo -S apt-get install -y wget`
                    );

                    if (log.code === 0) {
                        log = await ssh.execCommand(
                            `cd trivy && wget https://github.com/aquasecurity/trivy/releases/download/v0.50.1/trivy_0.50.1_Linux-64bit.tar.gz`
                        );
                    }
                    if (log.code === 0) {
                        log = await ssh.execCommand(
                            `cd trivy && tar zxvf trivy_0.50.1_Linux-64bit.tar.gz`
                        );
                    }
                    if (log.code === 0) {
                        log = await ssh.execCommand(
                            `cd trivy && echo "${
                                vm!.pass
                            }" | sudo -S mv trivy /usr/local/bin/`
                        );
                    }
                    log = await ssh.execCommand(`trivy -v`);
                    ssh.dispose();
                    if (log.code === 0) {
                        return success.ok({ message: "SUCCESSFULLY" });
                    }
                    if (log.code !== 0) {
                        return success.ok({ message: "FAILED", value: log });
                    }
                }
                throw new HttpError(
                    error.invalidData({
                        message: "id vm not found",
                    })
                );
            } else {
                throw new HttpError(
                    error.invalidData({
                        message: "token have problem",
                    })
                );
            }
        } else {
            throw new HttpError(
                error.invalidData({
                    message: "token have problem",
                })
            );
        }
    } catch (err: any) {
        throw error.notFound({
            value: err,
        });
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
                        port: 22,
                        tryKeyboard: true,
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
                log = await ssh.execCommand(`hadolint --version`);
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

export async function installHadolint(params: {
    user_id: string;
    vm_id: string;
}): Promise<ResultSuccess> {
    try {
        const ticket = await findTicketByUserId({ user_id: params.user_id });
        const path = __dirname;
        const file_path = resolve(path, "../../", "file/win/id_rsa");
        if (ticket.body && ticket.status === 200) {
            if (ticket.body.vms_ids) {
                const check = ticket.body.vms_ids.find((id) => {
                    return params.vm_id === id;
                });
                if (check) {
                    const ssh = new NodeSSH();

                    const vm = await Vms.findOne({
                        id: params.vm_id,
                    });

                    if (!vm) {
                        throw error.notFound({
                            location: "params",
                            param: "vm",
                            value: params.vm_id,
                            message: "HOST NOT EXITED",
                        });
                    }

                    // Đọc nội dung của file RSA vào biến privateKey
                    await ssh.connect({
                        host: vm!.host,
                        username: vm!.user,
                        password: vm!.pass,
                        port: 22,
                        tryKeyboard: true,
                    });

                    await ssh.execCommand("mkdir -p hadolint");
                    let log;
                    log = await ssh.execCommand(
                        `cd hadolint && wget https://github.com/hadolint/hadolint/releases/download/v2.7.0/hadolint-Linux-x86_64`
                    );

                    if (log.code === 0) {
                        log = await ssh.execCommand(
                            `cd hadolint && echo "${
                                vm!.pass
                            }" | sudo -S mv hadolint-Linux-x86_64 hadolint`
                        );
                    }
                    if (log.code === 0) {
                        log = await ssh.execCommand(
                            `cd hadolint && chmod +x hadolint`
                        );
                    }
                    if (log.code === 0) {
                        log = await ssh.execCommand(
                            `cd hadolint && echo "${
                                vm!.pass
                            }" | sudo -S mv hadolint /usr/local/bin/`
                        );
                    }
                    log = await ssh.execCommand(`hadolint --version`);
                    ssh.dispose();
                    if (log.code === 0) {
                        return success.ok({ message: "SUCCESSFULLY" });
                    } else {
                        throw new HttpError(
                            error.invalidData({
                                value: log,
                                message: "FAILED",
                            })
                        );
                    }
                } else {
                    throw new HttpError(
                        error.invalidData({
                            message: "id vm not found",
                        })
                    );
                }
            } else {
                throw new HttpError(
                    error.invalidData({
                        message: "token have problem",
                    })
                );
            }
        } else {
            throw new HttpError(
                error.invalidData({
                    message: "ticket not found",
                })
            );
        }
    } catch (err: any) {
        throw error.notFound({
            value: err,
        });
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
