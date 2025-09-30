import path from 'node:path' ;
import fs from 'fs/promises';

import { Logger } from 'infrastructure/log/log.js';

export class Blacklist {
    private static readonly blacklistDir: string = path.join(process.cwd(), 'config/blacklist');
    private static readonly defaultBlacklistFormmat = '[]';
    
    public static async get(guildID: string): Promise<string[]> {
        const filePath = path.join(this.blacklistDir, `${guildID}.json`);

        try {
            const blacklistData = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(blacklistData);
        } catch (error) {
            Logger.warn("DataBase", `getBlacklist - Blacklist file for guild ${guildID} not found. Creating a new one.`);
            await fs.writeFile(filePath, this.defaultBlacklistFormmat);
            return [];
        }
    }

    public static async add(guildID: string, userID: string): Promise<Boolean> {
        const filePath = path.join(this.blacklistDir, `${guildID}.json`);
        let blacklist: string[];

        try {
            const blacklistData = await fs.readFile(filePath, 'utf-8');
            blacklist = JSON.parse(blacklistData);
        } catch (error) {
            Logger.warn("DataBase", `addBlacklist - Blacklist file for guild ${guildID} not found. Creating a new one.`);
            blacklist = [];
        }

        if (!blacklist.includes(userID)) {
            blacklist.push(userID);
            await fs.writeFile(filePath, JSON.stringify(blacklist, null, 2));
            Logger.log("DataBase", `addBlacklist - User ${userID} added to blacklist for guild ${guildID}.`);
            return true;
        }
        
        Logger.log("DataBase", `addBlacklist - User ${userID} is already in blacklist for guild ${guildID}.`);
        return false;
    }

    public static async remove(guildID: string, userID: string): Promise<Boolean> {
        const filePath = path.join(this.blacklistDir, `${guildID}.json`);
        let blacklist: string[];

        try {
            const blacklistData = await fs.readFile(filePath, 'utf-8');
            blacklist = JSON.parse(blacklistData);
        } catch (error) {
            Logger.warn("DataBase", `removeBlacklist - Blacklist file for guild ${guildID} not found. Creating a new one.`);
            blacklist = [];
        }
        
        const index = blacklist.indexOf(userID);
        if (index !== -1) {
            blacklist.splice(index, 1);
            await fs.writeFile(filePath, JSON.stringify(blacklist, null, 2));
            Logger.log("DataBase", `removeBlacklist - User ${userID} removed from blacklist for guild ${guildID}.`);
            return true;
        } else {
            Logger.log("DataBase", `removeBlacklist - User ${userID} not found in blacklist for guild ${guildID}.`);
            return false;
        }
    }
}