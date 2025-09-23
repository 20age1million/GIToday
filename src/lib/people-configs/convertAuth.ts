import type { AuthorAggregate } from "../../types/github.js";
import { getMap } from "./map.js";
import { getBlacklist } from "./blacklist.js";

export async function convertAuth(auth: string): Promise<string> {
    const map = await getMap();
    if (!map) {
        console.log("[convertAuth] No map found, returning original auth");
        return auth;
    }

    if (map.has(auth)) {
        const mappedValue = map.get(auth);
        if (mappedValue !== undefined) {
            auth = mappedValue;
        }
    } else {
        console.log(`[convertAuth] No mapping for ${auth}, returning original`);
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
