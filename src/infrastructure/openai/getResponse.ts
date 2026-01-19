import { requireEnv } from "infrastructure/env/requireEnv.js";
import OpenAI from "openai";

export async function getResponse(messageContent: string): Promise<string> {
    const client = new OpenAI({
        apiKey: requireEnv("OPENAI_API_KEY")
    });

    const response = await client.responses.create({
        model: "gpt-5-nano",
        input: messageContent,
    });

    return response.output_text;
}
