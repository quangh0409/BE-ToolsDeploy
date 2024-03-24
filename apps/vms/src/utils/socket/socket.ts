import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http"; // Sử dụng createServer từ http
import logger from "logger";
import { database } from "app/build/result/error";
import { sshCheckConnect } from "../../controllers/vms.controller";

export class SocketServer {
    static instance: SocketServer;
    io: Server;

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

        socket.on("CheckConnectVM", async (token,host) => {
            const a = await sshCheckConnect(socket);
        });

        // Kết thúc (Done or out)
        socket.on("disconnect", () => {
            logger.info(`User '${socket.id}' disconnected!`);
        });
    };

}
