import type { AuthorAggregate, ListOptions, RepoSummary } from "../../types/github.js";
import { listOrgRepos } from "./repos.js";        
import { collectRepoReport } from "./report-repo.js"

export async function collectOrgReport (
    org: string,
    window: { since: string; until: string },
    opts: ListOptions = {}
): Promise<{ byRepo: Record<string, AuthorAggregate[]>; summary: AuthorAggregate[] }> {
    const perPage = opts.perPage ?? 100;
    const repoConcurrency = Math.max(1, opts.repoConcurrency ?? 3);

    // 1. list all repos
    const repos = await listOrgRepos(org, opts);
    if (!repos.length) {
        return { byRepo: {}, summary: []};
    }
    const repoNames = repos.map((rs: RepoSummary) => rs.name);

    
    // 2. Iterate all repos
    const byRepo: Record<string, AuthorAggregate[]> = {};
    let index = 0;

    async function worker() {
        while (true) {
            const i = index++;
            if (i >= repos.length) break;

            const repoName = repoNames[i];
            if (!repoName) continue;

            try {
                const agg = await collectRepoReport(org, repoName, window, opts);
                byRepo[repoName] = agg;
            } catch (err: any) {
                console.warn(`[org-report] skip repo ${org}/${repoName}:`, (err as any)?.message ?? err);
                byRepo[repoName] = []; 
            }
        }
    }

    const workers = Array.from({length: repoConcurrency}, () => worker());
    await Promise.all(workers);


    // 3, Aggregate all repos'info
    const merged = new Map<string, {additions: number, deletions: number, total: number}>();

    for (const repo of Object.keys(byRepo)) {
        if (!byRepo[repo]) continue;
        for (const row of byRepo[repo]) {
            const key = row.authorKey;
            const prev = merged.get(key) ?? { additions: 0, deletions: 0, total: 0};
            merged.set(key, {
                additions: prev.additions + (row.additions ?? 0),
                deletions: prev.deletions + (row.deletions ?? 0),
                total: prev.total + (row.total ?? 0)
            });
        }
    }

    const total: AuthorAggregate[] = Array.from(merged, ([authorKey, v]) => ({
        authorKey,
        additions: v.additions,
        deletions: v.deletions,
        total: v.total
    })).sort((a, b) => b.additions - a.additions);

    return { byRepo, summary: total };
}
