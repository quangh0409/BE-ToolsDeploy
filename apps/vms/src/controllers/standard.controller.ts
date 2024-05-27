import { ResultSuccess, error, success } from "app";
import { v1 } from "uuid";
import Standard from "../models/standard";
import Vms from "../models/vms";

export async function createStandard(params: {
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

    await standard.save();

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
