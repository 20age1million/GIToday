// fetch all branches for a given repo

import { Octokit } from "octokit";
import type { BranchSummary, ListOptions } from "shared/types/github.js";

export async function listBranches(
    octokit: Octokit,
    org: string,
    repo: string,
    opts?: { perPage?: number }
): Promise<BranchSummary[]> {
    const perPage = opts?.perPage ?? 100;

    try {
        const items = await octokit.paginate(
            octokit.rest.repos.listBranches,
            { owner: org, repo, per_page: perPage}
        );

        const branches: BranchSummary[] = items.map((b: any) => ({
            name: b.name,
            headSha: b.commit?.sha,
        })).filter(b => !!b.headSha);

        return branches;

    } catch (err: any) {
        throw new Error(`[branches] listBranches failed for ${org}/${repo}: ${err?.status ?? ""} ${err?.message ?? err}`);
    }
}
