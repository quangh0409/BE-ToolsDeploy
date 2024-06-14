import { HttpError, HttpStatus, ResultSuccess, error, success } from "app";
import { v1 } from "uuid";
import Standard from "../models/standard";
import Vms from "../models/vms";
import { NodeSSH } from "node-ssh";
import {
    deleteStandardOfTicketById,
    updateTicket,
} from "../services/ticket.service";

export async function createStandard(params: {
    userId: string;
    name: string;
    ram: string;
    cpu: string;
    core: string;
    os: string;
    architecture: string;
}): Promise<ResultSuccess> {
    const check = await Standard.findOne({ name: params.name });

    if (check) {
        throw error.notFound({
            param: "name",
            value: params.name,
            message: `the standard does exist`,
        });
    }

    const standard = new Standard({
        id: v1(),
        name: params.name,
        ram: params.ram,
        cpu: params.cpu,
        core: params.core,
        os: params.os,
        architecture: params.architecture,
    });

    await Promise.all([
        standard.save(),
        updateTicket({
            user_id: params.userId,
            standard_ids: standard.id,
        }),
    ]);

    return success.ok({ ...standard.toJSON(), _id: undefined });
}

export async function compareStandard(params: {
    standard: string;
    vms: string;
}): Promise<ResultSuccess> {
    const standard = await Standard.findOne({ id: params.standard });
    const vm = await Vms.findOne({ id: params.vms });

    if (!vm || !standard) {
        throw error.notFound({
            param: !vm && !standard ? "vm & standard" : !vm ? "vm" : "standard",
            value:
                !vm && !standard
                    ? `vm: ${params.vms} & standard: ${params.standard}`
                    : !vm
                    ? `vm: ${params.vms}`
                    : `standard: ${params.standard}`,
            message:
                !vm && !standard
                    ? `The vm: ${params.vms} & standard: ${params.standard} do not exist`
                    : !vm
                    ? `The vm: ${params.vms} do not exist`
                    : `The standard: ${params.standard} do not exist`,
        });
    }

    const rate_ram =
        Number.parseFloat(vm.ram) / Number.parseFloat(standard.ram);
    const rate_cpu =
        Number.parseFloat(vm.cpus) / Number.parseFloat(standard.cpu);
    const rate_core =
        Number.parseFloat(vm.cores) / Number.parseFloat(standard.core);
    const rate_os = vm.operating_system
        .toUpperCase()
        .includes(standard.os.toUpperCase())
        ? 1
        : 0;
    const rate_architecture = vm.architecture
        .toUpperCase()
        .includes(standard.architecture.toUpperCase())
        ? 1
        : 0;
    const rate_total =
        rate_ram * rate_cpu * rate_core * rate_os * rate_architecture;

    return success.ok({
        rate_total: rate_total,
        rate_ram: rate_ram,
        rate_cpu: rate_cpu,
        rate_core: rate_core,
        rate_os: rate_os,
        rate_architecture: rate_architecture,
    });
}

export async function compareStandardBeforeCreate(params: {
    standard: string;
    host: string;
    user: string;
    pass: string;
    port: string;
}): Promise<ResultSuccess> {
    try {
        const standard = await Standard.findOne({ id: params.standard });

        if (!standard) {
            throw error.notFound({
                value: params.standard,
                location: "body",
                message: "The standard not found",
            });
        }

        let ram, cpu, core, os, architecture;
        const ssh = new NodeSSH();
        await ssh.connect({
            host: params.host,
            username: params.user,
            password: params.pass,
            port: Number.parseInt(params.port),
            tryKeyboard: true,
        });

        let log;
        log = await ssh.execCommand("cat /etc/os-release");
        let operating_system = "";
        let kernel = "";
        architecture = "";
        log.stdout.split("\n").map((t) => {
            const ob = t.split("=");
            if ("PRETTY_NAME" === ob[0]) {
                operating_system = `${ob[1].replace(/"/g, "")}`;
            }
        });
        log = await ssh.execCommand("uname -o");
        operating_system += ` ${log.stdout}`;
        log = await ssh.execCommand("uname -r");
        kernel = `${log.stdout}`;
        log = await ssh.execCommand("uname -m");
        architecture = `${log.stdout}`;

        log = await ssh.execCommand(`free --giga | awk '/Mem/{print $2}'`);
        ram = `${log.stdout}GB`;
        log = await ssh.execCommand(`lscpu | grep '^CPU(s):'`);
        cpu = log.stdout.split(/\s{2,}/g)[1];
        log = await ssh.execCommand(`lscpu | grep 'Socket(s)'`);
        const sockets = log.stdout.split(/\s{2,}/g)[1];
        log = await ssh.execCommand(`lscpu | grep 'Core(s) per socket'`);
        core = `${
            Number.parseInt(log.stdout.split(/\s{2,}/g)[1]) *
            Number.parseInt(sockets)
        }`;

        const rate_ram =
            Number.parseFloat(ram) / Number.parseFloat(standard.ram);
        const rate_cpu =
            Number.parseFloat(cpu) / Number.parseFloat(standard.cpu);
        const rate_core =
            Number.parseFloat(core) / Number.parseFloat(standard.core);
        const rate_os = operating_system
            .toUpperCase()
            .includes(standard.os.toUpperCase())
            ? 1
            : 0;
        const rate_architecture = architecture
            .toUpperCase()
            .includes(standard.architecture.toUpperCase())
            ? 1
            : 0;
        const rate_total =
            rate_ram * rate_cpu * rate_core * rate_os * rate_architecture;

        return success.ok({
            rate_total: rate_total,
            rate_ram: rate_ram,
            rate_cpu: rate_cpu,
            rate_core: rate_core,
            rate_os: rate_os,
            rate_architecture: rate_architecture,
            standard: standard.toJSON(),
            vms: {
                os: operating_system,
                ram: ram,
                cpu: cpu,
                core: core,
                architecture: architecture,
            },
        });
    } catch (error) {
        throw new HttpError({
            status: HttpStatus.BAD_REQUEST,
            errors: [
                {
                    value: error,
                },
            ],
        });
    }
}

export async function getStandards(params: {
    standards: string[];
}): Promise<ResultSuccess> {
    const standards = await Standard.find({
        id: {
            $in: params.standards,
        },
    });

    return success.ok(standards);
}

export async function deleteStandard(params: {
    ticket: string;
    standard: string;
}): Promise<ResultSuccess> {
    const standards = await Standard.deleteOne({ id: params.standard });
    if (standards.deletedCount === 1) {
        const result = await deleteStandardOfTicketById({
            ticket: params.ticket,
            standard: params.standard,
        });

        if (result.body?.isDelete) {
            return success.ok({ message: "success fully" });
        }
    }

    throw error.notFound({
        param: "body",
        value: params.standard,
        message: "The standard not found",
    });
}
