import { Request, Router, Response, NextFunction } from "express";
import { SocketServer } from "../../utils";
import { Socket } from "socket.io";

export const router: Router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    console.log("da vao");
    res.status(200).send("Accepted");
    //Respond to indicate that the delivery was successfully received. Your server should respond with a 2XX response within 10 seconds of receiving a webhook delivery. If your server takes longer than that to respond, then GitHub terminates the connection and considers the delivery a failure.

    const githubEvent = req.headers["x-github-event"];
    //Check the x-github-event header to learn what event type was sent.

    if (githubEvent === "issues") {
        const data = req.body;
        const action = data.action;
        if (action === "opened") {
            console.log(
                `An issue was opened with this title: ${data.issue.title}`
            );
        } else if (action === "closed") {
            console.log(`An issue was closed by ${data.issue.user.login}`);
        } else {
            console.log(`Unhandled action for the issue event: ${action}`);
        }
    } else if (githubEvent === "ping") {
        console.log("GitHub sent the ping event");
    } else {
        console.log(`Unhandled event: ${githubEvent}`);
    }

    SocketServer.getInstance()
        .getSocket()
        ?.emit("webhooks", "connect webhooks successfully");
});
