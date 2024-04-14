import { Request, Router, Response, NextFunction } from "express";
import { webhookHandle } from "../../controllers/webhook.controller";

export const router: Router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).send("Accepted");
    //Respond to indicate that the delivery was successfully received. Your server should respond with a 2XX response within 10 seconds of receiving a webhook delivery. If your server takes longer than that to respond, then GitHub terminates the connection and considers the delivery a failure.
    const githubEvent = req.headers["x-github-event"];
    //Check the x-github-event header to learn what event type was sent.
    const data = req.body;

    await webhookHandle({ githubEvent, data });
});
