import type { CommitSummary, AuthorAggregate } from "../../types/github.js";
import { listBranches } from "./branches.js";
import { listCommits } from "./commits.js";

export async function collectRepoReport(
    org: string,
    repo: string,
    window: { since: string; until: string },
    opts?: { perPage?: number; concurrency?: number; ignoreMerges?: boolean }
): Promise<AuthorAggregate[]> {
    // 1. get all branches
    const branches = await listBranches(org, repo, opts);
    if (!branches) return [];

    // 2. collect CommitSummary
    const all: CommitSummary[] = [];
    for (const b of branches) {
        try {
            const summaries = await listCommits(org, repo, b.name, window, opts);
            if (summaries?.length) all.push(...summaries);
        } catch (err: any) {
            console.warn(
                `[repo-report] skip branch ${org}/${repo}@${b.name}:`,
                (err as any)?.message ?? err
                );
        }
    }

    if (!all.length) return [];

    // 3. aggregate
    const aggMap = new Map<
        string,
        {additions: number, deletions: number, total: number}
    >();

    for (const c of all) {
        const key = c.authorKey;
        const prev = aggMap.get(key) ?? {
            additions: 0,
            deletions: 0,
            total: 0
        };

        aggMap.set(key,
            {
                additions: prev.additions + (c.stats?.additions ?? 0),
                deletions: prev.deletions + (c.stats?.deletions ?? 0),
                total: prev.total + (c.stats?.total ?? (c.stats?.additions ?? 0) + (c.stats?.deletions ?? 0)),
            }
        );
    }

    // 4. output, sorted by decresing order in total
    const out: AuthorAggregate[] = Array.from(aggMap, ([authorKey, v]) => ({
        authorKey,
        additions: v.additions,
        deletions: v.deletions,
        total: v.total
    })).sort((a, b) => b.additions - a.additions);

    return out;
}
