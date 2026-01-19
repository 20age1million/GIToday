import { getResponse } from "infrastructure/openai/getResponse.js";
import { Logger } from "infrastructure/log/log.js";

export async function messageHandler(message: any) {
    // ignore bot messages
    if (message.author.bot) return;

    Logger.log("MessageCreate", `Message from ${message.author.tag}: ${message.content}`);

    // hardcoded client ID
    if (message.content.match(`^<@!?1374952529053352067>`)) {
        const response: string = await getResponse(message.content);
        message.channel.send(response);
    }
}