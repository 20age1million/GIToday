import type { AuthorAggregate } from "../../shared/types/github.js";
import { AuthMap } from "infrastructure/db/authMap.js";
import { Blacklist } from "infrastructure/db/blacklist.js";
import type { Client, Guild } from "discord.js";
import { Logger } from "infrastructure/log/log.js";

export class ConvertAuth {
    constructor( 
        public readonly client: Client, 
        public readonly guild: Guild 
    ) {}

    public static async create(client: Client, guild: Guild): Promise<ConvertAuth> {
        return new ConvertAuth(client, guild);
    }

    // Convert a single authorKey (user ID or raw string) to a display name if possible
    public async convertAuth(auth: string ): Promise<string> {
        const map = await AuthMap.get(this.guild.id);
        if (!map) {
            Logger.log("convertAuth", "No map found, returning original auth");
            return auth;
        }

        if (map.has(auth)) {
            const mappedValue = map.get(auth);
            if (mappedValue !== undefined) {
                auth = mappedValue;

                const username = await this.getUserName(mappedValue);
                if (username) {
                    auth = username;
                } else {
                    Logger.log(`convertAuth`, `Failed to get username for ${mappedValue}, using mapped value`);
                }
            }        

        } else {
            Logger.log(`convertAuth`, `No stored mapping for ${auth}, returning original`);
        }

        return auth; 
    }

    public mergeSameNamesInAuthAgg(arr: AuthorAggregate[]): AuthorAggregate[] {
        const map = new Map<string, AuthorAggregate>();

        for (const item of arr) {
            const key = item.authorKey;

            if (map.has(key)) {
                const prev = map.get(key) ?? { additions: 0, deletions: 0, total: 0};

                prev.additions = (prev.additions ?? 0) + (item.additions ?? 0);
                prev.deletions = (prev.deletions ?? 0) + (item.deletions ?? 0);
                prev.total     = (prev.total     ?? 0) + (item.total     ?? 0);
            } else {
                map.set(key, {
                    authorKey: key,
                    additions: item.additions ?? 0,
                    deletions: item.deletions ?? 0,
                    total:     item.total     ?? 0,
                });
            }
        }

        return Array.from(map.values()).sort();
    }

    public async removeAuthAggByBlackList(arr: AuthorAggregate[]): Promise<AuthorAggregate[]> {
        const blacklist = await Blacklist.get(this.guild.id);
        if (!blacklist) {
            console.log("[removeAuthAggByBlackList] No blacklist found, returning original array");
            return arr;
        }

        const filtered = arr.filter(item => !blacklist.includes(item.authorKey));
        return filtered
    }

    public async removeArrayByBlackList(arr: string[]): Promise<string[]> {
        const blacklist = await Blacklist.get(this.guild.id);
        if (!blacklist) {
            console.log("[removeArrayByBlackList] No blacklist found, returning original array");
            return arr;
        }

        const filtered = arr.filter(item => !blacklist.includes(item));
        return filtered
    }

    public async getUserName(userId: string): Promise<string> {
        // 首先 try 从 guild.members.cache 里拿
        let member;

        if (this.guild) {
            try {
                member = await this.guild.members.fetch(userId);
            } catch (err) {
                // 用户可能不在这个服务器，或者权限/intent 不足
                member = undefined;
            }
        }

        if (member) {
            // displayName 在 discord.js 表示 nickname 或 username fallback
            return member.displayName;  
        } else {
            // fallback：全局用户
            try {
            const user = await this.client.users.fetch(userId);
            return user.username;  
            } catch (err) {
            console.log(`[getUserName] Failed to fetch user ${userId}: ${err}`);
            return userId; // 或 “Unknown User”
            }
        }
    }

    public async convertAuthAgg(arr: AuthorAggregate[]): Promise<AuthorAggregate[]> {
        arr = await this.removeAuthAggByBlackList(arr);

        const promises = arr.map(async (item) => {
            const originalKey = item.authorKey;
            const convertedKey = await this.convertAuth(originalKey);
            return {
                ...item,
                authorKey: convertedKey,
            };
        });

        let convertedArr = await Promise.all(promises);

        convertedArr = this.mergeSameNamesInAuthAgg(convertedArr);
        return convertedArr;
    }
}