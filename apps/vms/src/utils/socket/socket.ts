import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http"; // Sử dụng createServer từ http
import logger from "logger";
import {
    sshCheckConnect,
    sshInstallDocker,
    sshInstallHadolint,
    sshInstallTrivy,
} from "../../controllers/vms.controller";
import {
    logOfDockerCompose,
    planCiCd,
} from "../../controllers/service.controller";
export class SocketServer {
    static instance: SocketServer;
    io: Server;
    socket: Socket | undefined;
    private sessionStore!: Map<string, string>;

    constructor(server: HttpServer) {
        this.sessionStore = new Map();
        // server.use(cookieParser());
        // Gắn kết socket.io với server HTTP
        this.io = new Server(server, {
            serveClient: false,
            maxHttpBufferSize: 1e8,
            pingInterval: 10000,
            pingTimeout: 5000,
            cookie: false,
            cors: {
                origin: "*",
            },
            path: "/socket.io"
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
        logger.info(`socket '${socket.id}' connected!`);

        const sessionId = socket.handshake.auth.sessionId || socket.id; // Sử dụng session ID từ handshake nếu có
        socket.join(sessionId); // Tham gia vào room theo session ID
        this.sessionStore.set(socket.id, sessionId);

        socket.on("logs", async (service, env) => {
            await logOfDockerCompose(service, env, socket);
        });

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

        socket.on("planCiCd", async (token, vm_id, service_id, env_name) => {
            logger.info(
                "🚀 ~ SocketServer ~ socket.on ~ token, vm_id, service_id, env_name:",
                token,
                vm_id,
                service_id,
                env_name
            );
            await planCiCd(socket, token, vm_id, service_id, env_name);
        });

        // Kết thúc (Done or out)
        socket.on("disconnect", () => {
            this.sessionStore.delete(socket.id);
            logger.info(`User '${socket.id}' disconnected!`);
        });

        this.socket = socket;
    };

    emitToSpecificSession(userId: string, event: string, ...args: any[]) {
        const sessionId = this.sessionStore.get(userId);
        if (sessionId) {
            this.io.to(sessionId).emit(event, ...args);
        } else {
            logger.warn(`Không tìm thấy phiên cho người dùng ${userId}`);
        }
    }

    getSocket() {
        return this.socket;
    }
}
