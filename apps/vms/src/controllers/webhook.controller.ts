import logger from "logger";
import { redis } from "../database";
import Service from "../models/service";
import { findTicketByGithubId } from "../services/ticket.service";
import { SocketServer } from "../utils";

export async function webhookHandle(params: {
    githubEvent: string | string[] | undefined;
    data: any;
}): Promise<void> {
    if (params.githubEvent === "push" || params.githubEvent === "status" ) {
        const { id: github_id, login: github_user } =
            params.data.repository.owner;

        const { name: repo, clone_url: source } = params.data.repository;
        const branch = params.data.ref.split("/")[2];
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
                source: source,
            });
            if (service) {
                const env = service.environment.find(
                    (e) => e.branch === branch
                );

                if (env) {
                    console.log(
                        "đã  gửi socket tới FE",
                        `webhooks-${user_id}`,
                        user_id,
                        service.id,
                        env!.name
                    );
                    SocketServer.getInstance().io.emit(
                        `webhooks-${user_id}`,
                        user_id,
                        service.id,
                        env!.name
                    );
                }
            }
            // SocketServer.getInstance()
            //     .getSocket()
            //     ?.emit("webhooks", user_id);
        }
    }
}
