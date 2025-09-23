import { promises as fs } from 'node:fs';
import path from 'node:path';

const RAW_ROOT = process.env.ROOT ?? ".";
const ROOT = path.resolve(process.cwd(), RAW_ROOT);

const CONFIG_DIR = path.join(ROOT, 'config');
const MAP_FILE = path.join(CONFIG_DIR, 'people_map.json');

export async function getMap(): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    let content: string;
    try {
        content = await fs.readFile(MAP_FILE, 'utf-8');
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            console.log(`[getMap] No map file found at ${MAP_FILE}, returning empty map`);
            return result;
        } else {
            throw err;
        }
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch (err) {
        console.error(`[getMap] Error parsing JSON from ${MAP_FILE}:`, err);
        return result;
    }

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof key === 'string' && typeof value === 'string') {
                result.set(key, value);
            } else {
                console.warn(`[getMap] Invalid entry in map file: key and value must be strings. Found key: ${key}, value: ${value}`);
            }
        }
    } else {
        console.error(`[getMap] Parsed content is not an object in ${MAP_FILE}`);
    }

    return result;
}

export async function appendMap(key: string, value: string): Promise<Boolean> {
    const map = await getMap();
    if (!(map.has(key))) {
        map.set(key, value);
        const obj = Object.fromEntries(map);
        await fs.writeFile(MAP_FILE, JSON.stringify(obj, null, 2) + "\n");
        return true;
    } else {
        return false;
    }
}

export async function removeFromMap(key: string): Promise<Boolean> {
    const map = await getMap();
    return map.delete(key);
}
