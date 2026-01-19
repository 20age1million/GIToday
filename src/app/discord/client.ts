import { Client, GatewayIntentBits, Events, ActivityType} from "discord.js";
import { requireEnv } from "infrastructure/env/requireEnv.js";
import { Logger } from "infrastructure/log/log.js";

/**
 * Launch a Discord bot and ensure it's ready before returning the client.
 */
async function createReadyBot(): Promise<Client<true>> {
    const token = requireEnv("DISCORD_TOKEN");
    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    });

    client.once(Events.ClientReady, () => {
        Logger.log(`ready`, `Logged in as ${client.user?.tag}`);
    });

    await client.login(token);

    client.user?.setPresence({
        status: 'online',
        activities: [
            {
                name: "Coding today?",
                type: ActivityType.Custom
            }
        ]
    });

    return client as Client<true>;
}

export const client: Client<true> = await createReadyBot();