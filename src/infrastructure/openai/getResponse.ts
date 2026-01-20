import { requireEnv } from "infrastructure/env/requireEnv.js";
import OpenAI from "openai";

export async function getResponse(messageContent: string): Promise<string> {
    const client = new OpenAI({
        apiKey: requireEnv("OPENAI_API_KEY")
    });

    const response = await client.responses.create({
        model: "gpt-5-nano",
        input: [
            {
                "role": "system",
                content: "You are a Discord bot that reports GitHub stat about a GitHub organization, your reply must within 2000 characters."
            },
            {
                "role": "user",
                content: messageContent
            }
        ]
    });

    return response.output_text;
}
