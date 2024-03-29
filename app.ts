import express, { NextFunction, Request, Response } from "express"
import * as crypto from "crypto";

const app = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ success: true });
});

app.listen(3000, () => {
    console.log('Server is running at 3000');
});

//funcion depara validar el secreto
const webhooksSecret = "ultrakillGODGAME";

const verify_signature = (req: Request) => {
    try {
        const signature = crypto
            .createHmac("sha256", webhooksSecret)
            .update(JSON.stringify(req.body))
            .digest("hex");
        let trusted = Buffer.from(`sha256=${signature}`, 'ascii');
        let untrusted = Buffer.from(req.header("x-hub-signature-256") || "", "ascii");
        return crypto.timingSafeEqual(trusted, untrusted);
    }
    catch (error) {
        return false;
    }
};

//middleware

const verify_signature_middleware = (req: Request, res: Response, next: NextFunction) => {
    if (!verify_signature(req)) {
        res.status(401).json({
            success: false,
            message: "Sin autorizacion"
        })
        return;
    }
    next();
}

app.post("/github-event", verify_signature_middleware, (req: Request, res: Response) => {
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