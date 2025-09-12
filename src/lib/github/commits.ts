// fetch all suitable commits for a given branch

import { octokit } from "./client.js";
import type { CommitDetails, CommitStat, CommitSummary, ListOptions, TimeWindow } from "../../types/github.js";


/**
 * Facade to collect CommitSummary[] across ALL branches for a repo in a time window.
 * Steps:
 *   1) listBranches(...) → BranchSummary[]
 *   2) for each branch: listCommitsDetail(...) → accumulate CommitDetails[]
 *   3) removeDuplicateCommits(...) by sha
 *   4) with controlled concurrency: listCommitStat(...) → CommitSummary[]
 * Options:
 *   - perPage?: number = 100
 *   - concurrency?: number (e.g. 5–10)
 *   - ignoreMerges?: boolean (optional filtering)
 */
export async function listCommits(
    org: string,
    repo: string,
    branch: string,
    window: TimeWindow,
    opts?: { perPage?: number; concurrency?: number; ignoreMerges?: boolean }
): Promise<CommitSummary[]> {
    const perPage = opts?.perPage ?? 100;
    const concurrency = Math.max(1, (opts?.concurrency ?? 8));
    const ignoreMerges = !!opts?.ignoreMerges;

    const commitDetails = await listCommitsDetail(org, repo, branch, window, opts);
    if (commitDetails.length === 0) return [];

    const filterredCommitDetails = removeDuplicateCommits(commitDetails);

    const commitSummary: CommitSummary[] = [];
    let index = 0;

    async function worker() {
        while (true) {
            const i = index++;
            if (i >= filterredCommitDetails.length) break;

            const item = filterredCommitDetails[i];

            if (!item) continue;
            
            try {
                const sum = await listCommitStat(org, repo, item);
                if (!ignoreMerges || !sum.isMerged) {
                    commitSummary.push(sum);
                }
            } catch (err: any) {
                console.warn(`[commit:stat] failed ${org}/${repo}#${item.sha}:`, (err as any)?.message ?? err);
            }
        }
    }

    const workers = Array.from({length: concurrency}, () => worker());
    await Promise.all(workers);

    return commitSummary;   
}


/**
 * List lightweight commit items for a branch within a time window.
 * Uses: GET /repos/{owner}/{repo}/commits  (sha=branch, since, until + pagination)
 * - Returns CommitDetails[]: { sha, authorLogin?, authorEmail?, date }
 */
export async function listCommitsDetail(
  org: string,
  repo: string,
  branch: string,
  window: { since: string; until: string },
  opts?: { perPage?: number }
): Promise<CommitDetails[]> {
    const perPage = opts?.perPage ?? 100;

    try {
        const items = await octokit.paginate(
            octokit.rest.repos.listCommits,
            {
                owner: org,
                repo,
                sha: branch,
                since: window.since,
                until: window.until,
                per_page: perPage
            }
        );

        const result: CommitDetails[] = items.map((c: any) => ({
            sha: c.sha,
            authorLogin: c.author?.login,
            authorEmail: c.commit?.author?.email ?? c.commit?.committer?.email,
            date: c.commit?.author?.date ?? c.commit?.committer?.date
        }));

        return result;
    } catch (err: any) {
        throw new Error(`[commits] listCommitsDetail failed for ${org}/${repo}@${branch}: ${err?.status ?? ""} ${err?.message ?? err}`);
    }
}

/**
 * Deduplicate commits by SHA.
 * - Multiple branches can reference the same commit; de-dup by sha is required.
 */
export function removeDuplicateCommits(
  items: CommitDetails[]
): CommitDetails[] {
    const seen = new Set<string>();
    const out: CommitDetails[] = [];

    for (const item of items) {
        const sha = item.sha;
        if (!sha) continue; // should not reach, commits always have sha
        if (seen.has(sha)) continue; // if already exist, do not count twice
        
        seen.add(sha);
        out.push(item);
    }

    return out;
}

/**
 * Enrich a single commit with stats via GET /repos/{owner}/{repo}/commits/{sha}.
 * - Builds CommitSummary: { sha, authorKey, stats:{additions,deletions,total}, isMerged }
 */
export async function listCommitStat(
  org: string,
  repo: string,
  item: CommitDetails
): Promise<CommitSummary> {
    const { data } = await octokit.rest.repos.getCommit({
        owner: org,
        repo,
        ref: item.sha
    });

    const additions = data.stats?.additions ?? 0;
    const deletions = data.stats?.deletions ?? 0;
    const total = data.stats?.total ?? additions + deletions;

    const isMerged = (data.parents?.length ?? 0) > 1; // 多于 1 个 parent 视为 merge commit（常见判定）

    // 统一作者键（先 login，退回 email）
    const authorKey = item.authorLogin ?? item.authorEmail ?? "unknown";

    const summary: CommitSummary = {
        sha: item.sha,
        authorKey,
        stats: { additions, deletions, total },
        isMerged,
    };

    return summary;
}
