// fetch all repos from github

import type { Octokit } from "octokit";
import type { RepoSummary, ListOptions } from "shared/types/github.js";

export async function listOrgRepos(
    octokit: Octokit,
    org: string,
    opts: ListOptions = {}
): Promise<RepoSummary[]> {

    const {
        includeForks = false,
        includeArchived = false,
        perPage = 100,
        type = "all",
    } = opts as any;

    try {
        // 1. fetch all pages
        const respos = await octokit.paginate(octokit.rest.repos.listForOrg, {
            org,
            per_page: perPage,
            type,
        });

        // 2. filter by fork and archived
        const filtered = respos.filter((r: any) => {
            const okForks = includeForks ? true : !r.fork;
            const okArchived = includeArchived ? true : !r.archived;
            return okForks && okArchived;
        });

        // 3, 
        return filtered.map( (r: any): RepoSummary => ({
                name: r.name,
                default_branch: r.default_branch,
                private: r.private,
                fork: r.fork,
                archived: r.archived,
            })
        )
    } catch (err: any) {
        throw new Error(`[repos] listOrgRepos failed for ${org}: ${err?.status ?? ""} ${err?.message ?? err}`);
    }
}