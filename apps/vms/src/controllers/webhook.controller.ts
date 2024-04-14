import { redis } from "../database";
import Service from "../models/service";
import { findTicketByGithubId } from "../services/ticket.service";
import { SocketServer } from "../utils";

export async function webhookHandle(params: {
    githubEvent: string | string[] | undefined;
    data: any;
}): Promise<void> {
    if (params.githubEvent === "push") {
        const { id: github_id, login: github_user } =
            params.data.repository.owner;

        const { name: repo } = params.data.repository;
        const branch = params.data.ref.split("/")[2];
        console.log("🚀 ~ branch:", branch);
        // const { clone_url: source } = params.data.clone_url;
        console.log("🚀 ~ source:", params.data.clone_url);
        const ticket = await findTicketByGithubId({ github_id: github_id });

        if (ticket && ticket.body) {
            const user_id = ticket.body.user_id;
            const service = await Service.findOne({
                environment: {
                    $elemMatch: {
                        // vm: {
                        //     $in: ticket.body.vms_ids,
                        // },
                        branch: branch,
                    },
                },

                repo: repo,
                // source: source,
            });
            console.log("🚀 ~ service:", service);
            const socket = await redis.get(user_id);
            if (socket) {
                SocketServer.getInstance()
                    .io.to(socket)
                    .emit("webhooks", user_id);
            }
            // SocketServer.getInstance()
            //     .getSocket()
            //     ?.emit("webhooks", user_id);
        }
    }
}
