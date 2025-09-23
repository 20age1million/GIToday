import { promises as fs } from 'node:fs';
import path from 'node:path';

const RAW_ROOT = process.env.ROOT ?? ".";
const ROOT = path.resolve(process.cwd(), RAW_ROOT);

const CONFIG_DIR = path.join(ROOT, 'config');
const BLACKLIST_FILE = path.join(CONFIG_DIR, 'people_blacklist.json');

export async function getBlacklist(): Promise<string[]> {
    const data = await fs.readFile(BLACKLIST_FILE);
    const json = data.toString() || "{}";
    const parsed = JSON.parse(json);

    if (Array.isArray(parsed)) {
        return parsed;
    } else {
        throw new Error("Invalid blacklist format");
    }
}

export async function appendBlacklist(name: string): Promise<Boolean> {
    const blacklist = await getBlacklist();
    if (!blacklist.includes(name)) {
        blacklist.push(name);
        await fs.writeFile(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2) + "\n");
        return true;
    } else {
        return false;
    }
}

export async function removeFromBlacklist(name: string): Promise<Boolean> {
    const blacklist = await getBlacklist();
    const index = blacklist.indexOf(name);
    if (index !== -1) {
        blacklist.splice(index, 1);
        await fs.writeFile(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2) + "\n");
        return true;
    } else {
        return false;
    }
}
