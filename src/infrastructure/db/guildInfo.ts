import fs from "fs/promises";
import path from "path";

import { Logger } from "infrastructure/log/log.js";

type GuildInfoSection = Record<string, string>;
type GuildInfoSchema = Record<string, GuildInfoSection>;

// a simple info
// { git : { platform: GitHub, authMethod: app/PAT, key: xxx, org: xxx} }

export class GuildInfo {
    private static readonly guildInfoDir: string = path.join(process.cwd(), 'config/guildInfo');
    private static readonly DEFAULT_GUILD_INFO: GuildInfoSchema = {
        git: {
            platform: "GitHub",
            authMethod: "app",
            key: "",
            org: ""
        }
    };

    static async initFile(guildID: string): Promise<void> {
        const filePath = path.join(this.guildInfoDir, `${guildID}.json`);
        await fs.writeFile(filePath, JSON.stringify(this.DEFAULT_GUILD_INFO, null, 2), 'utf-8');
    }

    static async get(guildID: string): Promise<Map<string, Map<string, string>>> {
        const filePath = path.join(this.guildInfoDir, `${guildID}.json`);

        let guildData: string;
        try {
            guildData = await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            Logger.warn("DataBase", `getGuildInfo - Guild info file for guild ${guildID} not found. Creating a new one.`);
            await this.initFile(guildID);
            return new Map<string, Map<string, string>>(Object.entries(this.DEFAULT_GUILD_INFO).map(([section, values]) => [section, new Map(Object.entries(values))]));
        }

        try {
            const parsed = JSON.parse(guildData) as GuildInfoSchema;

            const result = new Map<string, Map<string, string>>();
            for (const [section, values] of Object.entries(parsed)) {
                result.set(section, new Map(Object.entries(values)));
            }
            return result;
        } catch (error) {
            Logger.error("DataBase", `getGuildInfo - Failed to parse guild info file for guild ${guildID}: ${(error as any)?.message ?? error}`);
            throw error;
        }
    }

    static async set(guildID: string, schema: GuildInfoSchema): Promise<void> {
        const filePath = path.join(this.guildInfoDir, `${guildID}.json`);
        try {
            await fs.writeFile(filePath, JSON.stringify(schema, null, 2), 'utf-8');
        } catch (error) {
            Logger.error("DataBase", `setGuildInfo - Failed to write guild info file for guild ${guildID}: ${(error as any)?.message ?? error}`);
            throw error;
        }
    }

    public static async getGitInfo(guildID: string): Promise<GuildInfoSection> {
        const info = await this.get(guildID);
        const result = info.get('git') ? Object.fromEntries(info.get('git')!) : null;
        if (!result) {
            Logger.error("DataBase", `getGitInfo - Git info section missing for guild ${guildID}`);
            throw new Error(`Git info section missing for guild ${guildID}`);
        }
        return result;
    }

    public static async setGitInfo(guildID: string, gitInfo: GuildInfoSection): Promise<void> {
        let info = await this.get(guildID);
        let resultGitInfo = info.get('git')!;

        for (const [key, value] of Object.entries(gitInfo)) {
            resultGitInfo.set(key, value);
        }
            
        info.set('git', resultGitInfo);
        const schema: GuildInfoSchema = {};
        for (const [section, values] of info.entries()) {
            schema[section] = Object.fromEntries(values);
        }

        await this.set(guildID, schema);
    }

    public static async infoComplete(guildID: string): Promise<boolean> {
        try {
            const gitInfo = await this.getGitInfo(guildID);
            if (!gitInfo.platform || !gitInfo.authMethod || !gitInfo.key || !gitInfo.org) {
                return false;
            }
        } catch (error) {
            return false;
        }
        return true;
    }
}