import express, { Request, Response } from "express"

const app = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ success: true });
});

app.listen(3000, () => {
    console.log('Server is running at 3000');
});

app.post("/github-event", (req: Request, res: Response) => {
    const { body } = req;
    const { action, sender, repository } = body;
    const event = req.headers['x-github-event'];
    console.log(`Received event ${event} from ${sender.login} for repository ${repository.name}`);
    let message = "";
    switch (event) {
        case "issues":
            message = `Action: ${action}`;
            break;
        case "push":
            message = (`Commits: ${body.commits.length}`);
            break;
        case "star":
            message = (`Starred by ${sender.login}`);
            break;
        default:
            message = ("Event not handled");
    }

    notifyDiscord(message);
    res.status(200).json({
        success: true
    })
});


const webhookULR = "https://discord.com/api/webhooks/1204803431852810351/dWUN-U1MJbDQhKgCiUIDVjGjheQT8qPwFMwlV9UKKl_V01eAfMW87uiliAZAAcfhCiQi";
const notifyDiscord = async (message: string) => {

    const body = {
        content: message
    }

    const response = await fetch(webhookULR, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        console.log("error al enviar el mensaje")
        return false;
    }

    return true;
}