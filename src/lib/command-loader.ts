// to load command, auto skim all command module and dynamically load them
// done by GPT

/**
 * A command module must export the following members:
 *
 * 1. `data` (object)
 *    - Defines the slash command metadata (name, description, options).
 *    - Usually created with `new SlashCommandBuilder()`.
 *    - Must have a `.name` (string) and a `.toJSON()` method
 *      that produces a valid RESTPostAPIApplicationCommandsJSONBody.
 *
 *    Example:
 *    export const data = new SlashCommandBuilder()
 *      .setName("hello")
 *      .setDescription("Say hello");
 *
 * 2. `execute` (function)
 *    - The handler that runs when this slash command is invoked.
 *    - Signature: `(interaction: ChatInputCommandInteraction) => Promise<void>`
 *    - Must handle replies (reply/editReply/deferReply) within Discord’s 3-second limit.
 *    - Should catch errors internally or allow them to bubble up to the global
 *      try/catch in index.ts.
 *
 *    Example:
 *    export async function execute(interaction: ChatInputCommandInteraction) {
 *      await interaction.reply("Hello, world!");
 *    }
 *
 * Optional:
 * - You can add your own helpers, constants, or sub-functions in the same file,
 *   but only `data` and `execute` are consumed by the loader.
*/



import { readdir } from "node:fs/promises";
import { statSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type {
  RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";

import type { ExecuteFn, LoadedCommands} from "../types/command.js";

const isCommandFile = (file: string) =>
  /\.(?:c|m)?js$|\.ts$/i.test(file) && !/\.d\.ts$/i.test(file);

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (e.isFile() && isCommandFile(e.name)) {
      out.push(full);
    }
  }
  return out;
}

function resolveCommandsDir(): string {
  // 1) 生产构建：dist/commands
  const dist = path.resolve(process.cwd(), "dist", "commands");
  if (existsSync(dist) && statSync(dist).isDirectory()) return dist;

  // 2) 开发直跑：src/commands
  const src = path.resolve(process.cwd(), "src", "commands");
  if (existsSync(src) && statSync(src).isDirectory()) return src;

  // 3) 兜底：当前目录下的 commands
  const local = path.resolve(process.cwd(), "commands");
  return local;
}

export async function loadAllCommands(): Promise<LoadedCommands> {
  const routes = new Map<string, ExecuteFn>();
  const definitions: RESTPostAPIApplicationCommandsJSONBody[] = [];
  const loadedFiles: string[] = [];

  const baseDir = resolveCommandsDir();
  if (!existsSync(baseDir)) {
    console.warn(`[commands] Directory not exists ${baseDir}`);
    return { routes, definitions, loadedFiles };
  }

  const files = await walk(baseDir);

  for (const file of files) {
    try {
      // 用 file:// URL 动态导入，兼容 Windows 路径
      const mod = await import(pathToFileURL(file).href);

      const data = mod?.data;
      const execute: ExecuteFn | undefined = mod?.execute;

      if (!data?.name || typeof execute !== "function") {
        console.warn(`[commands] Skipped, unmatched interface: ${file}`);
        continue;
      }

      if (typeof data.toJSON === "function") {
        definitions.push(data.toJSON() as RESTPostAPIApplicationCommandsJSONBody);
      } else {
        console.warn(`[commands] Warning: ${file} does not have data.toJSON(); cannot register`);
      }

      routes.set(data.name, execute);
      loadedFiles.push(file);
    } catch (err) {
      console.warn(`[commands] failed to load: ${file}`, err);
    }
  }

  console.log(`[commands] Loaded ${routes.size} commands; from ${loadedFiles.length} files.`);
  return { routes, definitions, loadedFiles };
}