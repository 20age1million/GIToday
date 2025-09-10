// store all types defined in this project

import type { 
    ChatInputCommandInteraction,
    RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";

/**
 * ExecuteFn type:
 *   A function that accepts a ChatInputCommandInteraction
 *   and performs the command’s logic asynchronously.
 *
 * Signature:
 *   type ExecuteFn = (interaction: ChatInputCommandInteraction) => Promise<void>;
 */
export type ExecuteFn = (interaction: ChatInputCommandInteraction) => Promise<void>;



/**
 * LoadedCommands object returned by `loadAllCommands()`:
 *
 * routes: Map<string, ExecuteFn>
 *   - Key: command name (string, e.g., "hello").
 *   - Value: the execute function to call when the command is invoked.
 *
 * definitions: RESTPostAPIApplicationCommandsJSONBody[]
 *   - Array of command definitions (from `data.toJSON()`).
 *   - Used for registering commands with Discord’s REST API.
 *
 * loadedFiles: string[]
 *   - List of absolute file paths that were successfully loaded as commands.
 */
export type LoadedCommands = {
  routes: Map<string, ExecuteFn>;
  definitions: RESTPostAPIApplicationCommandsJSONBody[];
  loadedFiles: string[];
};