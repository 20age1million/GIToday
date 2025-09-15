import type { AuthorAggregate } from "../types/github.js";


export function convertAuth(auth: string): string {
    // did not impl yet
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

export function removeArrayByBlackList(arr: string[]): string[] {
    
    return arr;
}

export function removeAuthAggByBlackList(arr: AuthorAggregate[]): AuthorAggregate[] {

    return arr;
}