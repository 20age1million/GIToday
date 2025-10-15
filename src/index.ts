import { Logger } from "infrastructure/log/log.js";
import { requireEnv } from "infrastructure/env/requireEnv.js";
import { loadAllCommands } from "app/commands/command-loader.js";

import {
    REST, 
    Routes,
    type Interaction,
    MessageFlags,
    Events,
} from "discord.js";

export async function registerCommands(){
    // check if commandline arg
    const modeArg = process.argv.find(arg => arg.startsWith('--mode='));
    if (modeArg) {
        Logger.log("Register Commands", `Starting in mode: ${modeArg}`);
        const [, val] = modeArg.split('=');
        if (val === 'dev') {
            await registerCommandToGuild();
        } else if (val === 'prod') {
            await registerCommandToGlobal();
        } else {
            Logger.warn("Register Commands", `Unknown mode: ${val}, defaulting to 'dev'`);
            await registerCommandToGuild();
        }
    } else{
        Logger.warn("Register Commands", `No mode specified, defaulting to 'dev'`);
        await registerCommandToGuild();
    }
}

async function registerCommandToGuild() {
    const guildID = requireEnv("DISCORD_GUILD_ID");

    if (!guildID) {
        Logger.error("RegisterCommandToGuild", "Missing GUILD_ID, skip guild registration.");
        return;
    }

    const rest = new REST({version: "10"}).setToken(token);
    try {
        Logger.log("Register Guild", `Registering ${commandDefs.length} commands to Guild ${guildID}...`);
        await rest.put(Routes.applicationGuildCommands(clientID, guildID), {
            body: commandDefs
        });
        Logger.log("Register Guild", "Guild command registration done.");
    } catch (err) {
        Logger.error("Register Guild", `❌ Guild registration failed: ${err}`);
    }
}

async function registerCommandToGlobal() {
    const rest = new REST({ version: "10" }).setToken(token);
    try {
        Logger.log("Register Global", `Registering ${commandDefs.length} commands globally...`);
        await rest.put(
        Routes.applicationCommands(clientID),
            {
                body: commandDefs,
            }
        );
        Logger.log("Register Global", "Global command registration done.");
    } catch (err) {
        Logger.error("Register Global", `❌ Global registration failed: ${err}`);
    }
}

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
        Logger.error(`command`, `${interaction.commandName} falied.`);
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
    Logger.log("Close", `received signal ${signal}`);
    Logger.log("Close", "logging out...");
    await client.destroy();
    setImmediate(() => { process.exit(0); });
}


////////////////////////////////////////////////////
process.once("SIGINT", shutdownHandler);
process.once("SIGTERM", shutdownHandler);

import 'dotenv/config';
import { client } from "app/discord/client.js";
import { scheduler } from "app/scheduler/scheduler.js";

const clientID = client.user.id;
const token = requireEnv("DISCORD_TOKEN");

client.on(Events.InteractionCreate, commandHandler);

const loaded = await loadAllCommands();
const commandRoutes = loaded.routes;
const commandDefs = loaded.definitions;

await registerCommands();

Logger.log("init", "All initialization done");