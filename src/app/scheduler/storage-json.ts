// storageg-json.ts
// JSON-backed storage for guild schedule configs (scheduler)
// - Ensures config directory/file exist
// - Safe atomic writes (temp file + rename)

import { promises as fs } from "node:fs";
import path from "node:path";
import type { GuildScheduleConfig } from "../shared/types/schedule.js";

// Resolve ROOT from env (optional). If not set, fallback to process.cwd().
const RAW_ROOT = process.env.ROOT ?? ".";
const ROOT = path.resolve(process.cwd(), RAW_ROOT);

// Single state file under ROOT/config
const CONFIG_DIR = path.join(ROOT, "config");

const STATE_FILE = path.join(CONFIG_DIR, "schedule-task.json");
// const STATE_FILE = path.join(CONFIG_DIR, ".json");

// Internal shape on disk: guildId -> config
type State = Record<string, GuildScheduleConfig>;

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function ensureFile(filePath: string, defaultJson: string): Promise<void> {
  try {
    // 'wx' ensures we only create if it does not exist; otherwise throws EEXIST
    await fs.writeFile(filePath, defaultJson, { flag: "wx" });
  } catch (err: any) {
    if (err?.code === "EEXIST") return; // already exists
    if (err?.code === "ENOENT") {
      // parent dir missing: create and retry once
      await ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, defaultJson, { flag: "wx" });
      return;
    }
    throw err;
  }
}

async function load(): Promise<State> {
  try {
    const buf = await fs.readFile(STATE_FILE);
    const json = buf.toString() || "{}";
    const parsed = JSON.parse(json) as State;
    // basic sanity: ensure objects are well-formed
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch (err: any) {
    if (err?.code === "ENOENT") return {};
    throw err;
  }
}

// Atomic write: write to temp file then rename over the target.
async function save(state: State): Promise<void> {
  await ensureDir(CONFIG_DIR);
  const tmp = STATE_FILE + ".tmp-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  const payload = JSON.stringify(state, null, 2) + "\n";
  await fs.writeFile(tmp, payload, { encoding: "utf8" });
  await fs.rename(tmp, STATE_FILE);
}

/**
 * Public API
 */
export async function getConfig(guildId: string): Promise<GuildScheduleConfig | null> {
  const s = await load();
  return s[guildId] ?? null;
}

const DEFAULTS: GuildScheduleConfig = {
  enabled: false,
  time: "08:00",
  timeZone: "America/Toronto",
  channelId: "",
};

export async function saveConfig(
  guildId: string,
  patch: Partial<GuildScheduleConfig> | GuildScheduleConfig
): Promise<void> {

  // Ensure file exists (first run)
  await ensureFile(STATE_FILE, JSON.stringify({}, null, 2) + "\n");

  const state = await load();
  const current = state[guildId] ?? DEFAULTS;
  // Merge (patch wins)
  const next: GuildScheduleConfig = { ...current, ...patch } as GuildScheduleConfig;
  state[guildId] = next;
  await save(state);
}

export async function listGuildIds(): Promise<string[]> {
  const s = await load();
  return Object.keys(s);
}

// Optional helpers that some callers may find useful
export async function upsertConfig(guildId: string, cfg: GuildScheduleConfig): Promise<void> {
  const state = await load();
  state[guildId] = cfg;
  await save(state);
}

export async function deleteConfig(guildId: string): Promise<void> {
  const state = await load();
  if (guildId in state) {
    delete state[guildId];
    await save(state);
  }
}
