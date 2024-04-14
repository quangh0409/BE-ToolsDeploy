import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http"; // Sử dụng createServer từ http
import logger from "logger";
import { database } from "app/build/result/error";
import {
    sshCheckConnect,
    sshInstallDocker,
    sshInstallHadolint,
    sshInstallTrivy,
} from "../../controllers/vms.controller";
import { build, clear, clone, deploy, scanDockerfile, scanImages } from "../../controllers/service.controller";

export class SocketServer {
    static instance: SocketServer;
    io: Server;
    socket: Socket | undefined;

    constructor(server: HttpServer) {
        // Gắn kết socket.io với server HTTP
        this.io = new Server(server, {
            serveClient: false,
            pingInterval: 10000,
            pingTimeout: 5000,
            cookie: false,
            cors: {
                origin: "*",
            },
        });

        this.io.on("connect", this.onConnection);
    }

    static getInstance() {
        return SocketServer.instance;
    }

    static setInstance(server: HttpServer) {
        if (!SocketServer.instance) {
            SocketServer.instance = new SocketServer(server);
        }
    }
    onConnection = (socket: Socket) => {
        logger.info(`User '${socket.id}' connected!`);

        socket.on("CheckConnectVM", async (token, vm_id) => {
            await sshCheckConnect(socket, token, vm_id);
        });

        socket.on("InstallDocker", async (token, vm_id) => {
            await sshInstallDocker(socket, token, vm_id);
        });

        socket.on("InstallTrivy", async (token, vm_id) => {
            await sshInstallTrivy(socket, token, vm_id);
        });

        socket.on("InstallHadolint", async (token, vm_id) => {
            await sshInstallHadolint(socket, token, vm_id);
        });

        socket.on("clone", async (token, vm_id, service_id, env_name) => {
            await clone(socket, token, vm_id, service_id, env_name);
        });

        socket.on("scanSyntax", async (token, vm_id, service_id, env_name) => {
            await scanDockerfile(socket, token, vm_id, service_id, env_name);
        });

        socket.on("clear", async (token, vm_id, service_id, env_name) => {
            await clear(socket, token, vm_id, service_id, env_name);
        });

        socket.on("build", async (token, vm_id, service_id, env_name) => {
            await build(socket, token, vm_id, service_id, env_name);
        });

        socket.on("scanImages", async (token, vm_id, service_id, env_name) => {
            await scanImages(socket, token, vm_id, service_id, env_name);
        });

        socket.on("deploy", async (token, vm_id, service_id, env_name) => {
            await deploy(socket, token, vm_id, service_id, env_name);
        });

        // Kết thúc (Done or out)
        socket.on("disconnect", () => {
            logger.info(`User '${socket.id}' disconnected!`);
        });

        this.socket = socket;
    };

    getSocket() {
        return this.socket;
    }
}
