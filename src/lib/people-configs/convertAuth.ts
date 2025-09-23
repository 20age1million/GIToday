import type { AuthorAggregate } from "../../types/github.js";
import { getMap } from "./map.js";
import { getBlacklist } from "./blacklist.js";
import type { Client, Guild } from "discord.js";

export async function convertAuth(client: Client, auth: string, guild?: Guild): Promise<string> {
    const map = await getMap();
    if (!map) {
        console.log("[convertAuth] No map found, returning original auth");
        return auth;
    }

    if (map.has(auth)) {
        const mappedValue = map.get(auth);
        if (mappedValue !== undefined) {
            auth = mappedValue;

            const username = await getUserName(client, guild, mappedValue);
            if (username) {
                auth = username;
            } else {
                console.log(`[convertAuth] Failed to get username for ${mappedValue}, using mapped value`);
            }
        }        

    } else {
        console.log(`[convertAuth] No stored mapping for ${auth}, returning original`);
    }

    return auth; 
}

export function mergeSameNamesInAuthAgg(arr: AuthorAggregate[]): AuthorAggregate[] {
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

export async function removeAuthAggByBlackList(arr: AuthorAggregate[]): Promise<AuthorAggregate[]> {
    const blacklist = await getBlacklist();
    if (!blacklist) {
        console.log("[removeAuthAggByBlackList] No blacklist found, returning original array");
        return arr;
    }

    const filtered = arr.filter(item => !blacklist.includes(item.authorKey));
    return filtered
}

export async function removeArrayByBlackList(arr: string[]): Promise<string[]> {
    const blacklist = await getBlacklist();
    if (!blacklist) {
        console.log("[removeArrayByBlackList] No blacklist found, returning original array");
        return arr;
    }

    const filtered = arr.filter(item => !blacklist.includes(item));
    return filtered
}

async function getUserName(client: Client, guild: Guild | undefined, userId: string): Promise<string> {
  // 首先 try 从 guild.members.cache 里拿
  let member;

  if (guild) {
    try {
        member = await guild.members.fetch(userId);
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
      const user = await client.users.fetch(userId);
      return user.username;  
    } catch (err) {
      console.log(`[getUserName] Failed to fetch user ${userId}: ${err}`);
      return userId; // 或 “Unknown User”
    }
  }
}