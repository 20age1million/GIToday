import fs from 'fs/promises';
import path from 'path';

import { Logger } from 'infrastructure/log/log.js';


export class AuthMap {
    private static readonly mapDir: string = path.join(process.cwd(), 'config/authMap');
    private static readonly defaultMapFormat = '{}';

    public static async get(guildID: string): Promise<Map<string, string>> {
        const filePath = path.join(this.mapDir, `${guildID}.json`);

        try {
            const mapData = await fs.readFile(filePath, 'utf-8');
            const obj = JSON.parse(mapData);
            return new Map(Object.entries(obj));
        } catch (error) {
            Logger.warn("DataBase", `getAuthMap - Auth map file for guild ${guildID} not found. Creating a new one.`);
            await fs.writeFile(filePath, this.defaultMapFormat);
            return new Map();
        }
    }

    public static async set(guildID: string, key: string, value: string): Promise<Boolean> {
        const filePath = path.join(this.mapDir, `${guildID}.json`);
        let authMap: Map<string, string>;

        try {
            const mapData = await fs.readFile(filePath, 'utf-8');
            const obj = JSON.parse(mapData);
            authMap = new Map(Object.entries(obj));
        } catch (error) {
            Logger.warn("DataBase", `setAuthMap - Auth map file for guild ${guildID} not found. Creating a new one.`);
            authMap = new Map();
        }

        if (!authMap.has(key)) {
            authMap.set(key, value);
            const obj = Object.fromEntries(authMap);
            await fs.writeFile(filePath, JSON.stringify(obj, null, 2));
            Logger.log("DataBase", `setAuthMap - Key ${key} added to auth map for guild ${guildID}.`);
            return true;
        }

        Logger.log("DataBase", `setAuthMap - Key ${key} is already in auth map for guild ${guildID}.`);
        return false;
    }

    public static async remove(guildID: string, key: string): Promise<Boolean> {
        const filePath = path.join(this.mapDir, `${guildID}.json`);
        let authMap: Map<string, string>;

        try {
            const mapData = await fs.readFile(filePath, 'utf-8');
            const obj = JSON.parse(mapData);
            authMap = new Map(Object.entries(obj));
        } catch (error) {
            Logger.warn("DataBase", `removeAuthMap - Auth map file for guild ${guildID} not found. Creating a new one.`);
            authMap = new Map();
        }

        if (authMap.has(key)) {
            authMap.delete(key);
            const obj = Object.fromEntries(authMap);
            await fs.writeFile(filePath, JSON.stringify(obj, null, 2));
            Logger.log("DataBase", `removeAuthMap - Key ${key} removed from auth map for guild ${guildID}.`);
            return true;
        }

        Logger.log("DataBase", `removeAuthMap - Key ${key} not found in auth map for guild ${guildID}.`);
        return false;
    }
}