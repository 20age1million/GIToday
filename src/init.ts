import { mkdir } from "node:fs/promises";
import path from "node:path";

import { Logger } from "infrastructure/log/log.js";

////////////////////////////////////////////////////
// config initialization
// ensure required directories exist
const ROOT = path.resolve(process.cwd(), "./");
const CONFIG_DIR = path.join(ROOT, "config");
const REQUIRED_DIRS = [
    CONFIG_DIR,
    path.join(CONFIG_DIR, "blacklist"),
    path.join(CONFIG_DIR, "authMap"),        
    path.join(CONFIG_DIR, "guildInfo"),    
    path.join(CONFIG_DIR, "tasks"),          
];

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true }); // 已存在时静默通过
  Logger.log(`init config`, `ensured dir: ${path.relative(ROOT, dir)}`);
}

/////////////////////////////////////////////////
Logger.log("init config", "start bootstrap…");
for (const dir of REQUIRED_DIRS) {
    await ensureDir(dir);
}
Logger.log("init config", "done");
