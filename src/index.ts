// index.js - main enterance

// terminalogy //
// Guild is basically a discord server
// Client is a bot


import 'dotenv/config'; // Load environment variables first

import {
    Client, // the bot itself
    Events, // a collection of event name
    GatewayIntentBits, // declare which event will bot observer
    type ChatInputCommandInteraction, // collection of input
    REST, // REST
    Routes,
    type Interaction,
    MessageFlags,
    ActivityType,
} from "discord.js";

import type { ExecuteFn, LoadedCommands} from "./types/command.js";
import { loadAllCommands } from "./lib/command-loader.js";
import { requireEnv } from "./lib/requireEnv.js";
import { initMessenger, initScheduler } from "./scheduler/index.js";

import { init } from './init.js';

//////////////////////////////////////

// register all command to guild
async function registerCommandToGuild() {
    const clientID = requireEnv("DISCORD_CLIENT_ID");
    const guildID = requireEnv("DISCORD_GUILD_ID");

    if (!clientID || !guildID) {
        console.warn("[Warning] Missing CLIENT_ID or GUILD_ID, skip guild registration.");
        return;
    }

    if (commandDefs.length === 0) {
        console.warn("[Warning] No command definitions to register.");
        return;
    }

    if (!token) process.exit(1);
    const rest = new REST({version: "10"}).setToken(token);
    try {
        console.log(`Registering ${commandDefs.length} commands to Guild ${guildID}...`);
        await rest.put(Routes.applicationGuildCommands(clientID, guildID), {
            body: commandDefs
        });
        console.log("Guild command registration done.");
    } catch (err) {
    console.error("❌ Guild registration failed:", err);
    }
}

// handler input command
async function commandHandler(interaction: Interaction) {
    // if is not slash command, return
    if (!interaction.isChatInputCommand()) return;

    // get corresponding function
    const execute = commandRoutes.get(interaction.commandName);

    // if command does not exist
    if (!execute) {
        const msg = "Invalid command.";
        // if current interaction is deferred or replied, 
        if (interaction.deferred || interaction.replied) {
            // then must edit previous reply
            interaction.editReply(msg).catch(() => {});
        }
        else {
            // reply to user
            // ephemeral -> only visible for user who call this command
            interaction.reply({content: msg, flags: MessageFlags.Ephemeral}).catch(() => {});
        }
        return;
    }

    // if command is valid
    try {
        await execute(interaction);   
    } catch (err) {
        console.error(`[command: ${interaction.commandName}] falied.`, err);
        const msg = "Command failed, please contact Benson.";
        // if current interaction is deferred or replied, 
        if (interaction.deferred || interaction.replied) {
            // then must edit previous reply
            await interaction.editReply(msg).catch(() => {});
        }
        else {
            // reply to user
            // ephemeral -> only visible for user who call this command
            await interaction.reply({content: msg, flags: MessageFlags.Ephemeral}).catch(() => {});
        }
    }
}

async function shutdownHandler(signal: string) {
    console.log(`[close] received signal ${signal}`);
    console.log("[close] logging out...");
    await client.destroy();
    setImmediate(() => { process.exit(0); });
}

// use async so await can be used
async function main() {
    // one-time observer to print when bot is logged in
    client.once(Events.ClientReady, async (c) => {
        console.log(`[ready] logged in as ${c.user.tag} (${c.user.id})`);

        client.user?.setPresence({
            status: 'online',
            activities: [
                {
                    name: "Coding today?",
                    type: ActivityType.Custom
                }
            ]
        });
    });

    // add observer to react with command
    client.on(Events.InteractionCreate, commandHandler);

    // add observer to react with shutdown
    process.once("SIGINT", shutdownHandler);
    process.once("SIGTERM", shutdownHandler);

    const loaded = await loadAllCommands();
    commandRoutes = loaded.routes;
    commandDefs = loaded.definitions;

    await registerCommandToGuild();

    console.log(`[bootstrap] logging in...`);
    await client.login(token);
    // if succeed, Events.ClientReady is toggled
}

///////////////////////////////////

init().catch((e) => {
  console.error("[init] failed:", e);
  process.exit(1);
});

// get discord token from env
const token = requireEnv("DISCORD_TOKEN");

// create bot instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds], // minimum need for MVP
});

const messenger = initMessenger(client);
export const scheduler = await initScheduler(client);

let commandRoutes = new Map<string, ExecuteFn>();
let commandDefs: any[] = [];

main();
