import path from 'path';
import fs from 'fs/promises';
import type { GuildScheduleConfig } from 'shared/types/schedule.js';

import { Logger } from 'infrastructure/log/log.js';

export class Tasks{
    private static readonly tasksDir: string = path.join(process.cwd(), 'config/tasks');
    private static readonly defualtTasksFormat = '{}';

    public static async get(guildID: string): Promise<GuildScheduleConfig> {
        const filePath = path.join(this.tasksDir, `${guildID}.json`);

        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data) as GuildScheduleConfig;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                // File does not exist, return default config
                return JSON.parse(this.defualtTasksFormat) as GuildScheduleConfig;
            } else {
                Logger.error("DataBase", `Failed to read schedule config for guild ${guildID}:`);
                throw error;
            }
        }
    }

    public static async set(guildID: string, config: Partial<GuildScheduleConfig>): Promise<void> {
        const filePath = path.join(this.tasksDir, `${guildID}.json`);
        
        const originalConfig = await this.get(guildID);
        const newConfig = { ...originalConfig, ...config };
        const configToSave = newConfig as GuildScheduleConfig;

        try {
            await fs.writeFile(filePath, JSON.stringify(configToSave, null, 2), 'utf-8');
        } catch (error) {
            Logger.error("DataBase", `Failed to write schedule config for guild ${guildID}:`);
            throw error
        }
    }

    public static async listGuilds(): Promise<string[]> {
        try {
            const files = await fs.readdir(this.tasksDir);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => path.basename(file, '.json'));
        } catch (error) {
            Logger.error("DataBase", 'Failed to list guilds with schedule config:');
            throw error;
        }
    }
}
