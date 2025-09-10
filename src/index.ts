// index.js - main enterance

// terminalogy //
// Guild is basically a discord server
// Client is a bot


// use .env to store
import dotenv from "dotenv";

import {
    Client, // the bot itself
    Events, // a collection of event name
    GatewayIntentBits, // declare which event will bot observer
    type ChatInputCommandInteraction, // collection of input
    REST, // REST
    Routes
} from "discord.js";

import type { ExecuteFn, LoadedCommands} from "./types/command.js";
import { loadAllCommands } from "./lib/command-loader.js";
import { requireEnv } from "./lib/requireEnv.js";

// load env
dotenv.config();

// get discord token from env
const token = requireEnv("DISCORD_TOKEN");

let commandRoutes = new Map<string, ExecuteFn>();
let commandDefs: any[] = [];

// create bot instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds], // minimum need for MVP
})

// one-time observer to print when bot is logged in
client.once(Events.ClientReady, (c) => {
    console.log(`[ready] logged in as ${c.user.tag} (${c.user.id})`);
});


// add observer to react with command
client.on(Events.InteractionCreate, async (intereaction) => {
    // if is not slash command, return
    if (!intereaction.isChatInputCommand()) return;

    // get corresponding function
    const execute = commandRoutes.get(intereaction.commandName);

    // if command does not exist
    if (!execute) {
        const msg = "Invalid command.";
        // if current interaction is deferred or replied, 
        if (intereaction.deferred || intereaction.replied) {
            // then must edit previous reply
            intereaction.editReply(msg).catch(() => {});
        }
        else {
            // reply to user
            // ephemeral -> only visible for user who call this command
            intereaction.reply({content: msg, ephemeral: true}).catch(() => {});
        }
        return;
    }

    // if command is valid
    try {
        await execute(intereaction);   
    } catch (err) {
        console.error(`[command: ${intereaction.commandName}] falied.`, err);
        const msg = "Command failed, please contact Benson.";
        // if current interaction is deferred or replied, 
        if (intereaction.deferred || intereaction.replied) {
            // then must edit previous reply
            await intereaction.editReply(msg).catch(() => {});
        }
        else {
            // reply to user
            // ephemeral -> only visible for user who call this command
            await intereaction.reply({content: msg, ephemeral: true}).catch(() => {});
        }
    }
});

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

// login
// use async so await can be used
(async () => {
    const loaded = await loadAllCommands();
    commandRoutes = loaded.routes;
    commandDefs = loaded.definitions;

    await registerCommandToGuild();

    console.log(`[bootstrap] logging in...`);
    await client.login(token);
    // if succeed, Events.ClientReady is toggled
})();

