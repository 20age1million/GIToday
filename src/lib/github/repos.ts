// fetch all repos from github

import { octokit } from "./client.js";
import type {
    RepoSummary,
    ListOptions
} from "../../types/github.js";

export async function listOrgRepos(
    org: string,
    opts: ListOptions = {}
): Promise<RepoSummary[]> {

    const {
        includeForks = false,
        includeArchived = false,
        perPage = 100,
        type = "all",
    } = opts as any;

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
}

export async function safeListOrgRepos (
    org: string,
    opts: ListOptions = {}
): Promise<RepoSummary[]> {
    try {
        return await listOrgRepos(org, opts);
    } catch (err: any) {
        const status = err?.stats;
        const h = err?.response?.headers ?? {};
        const remain = h["x-ratelimit-remaining"];
        const reset = h["x-ratelimit-reset"];
        const retryAfter = h["retry-after"];
        console.error(
        `[repos] list failed org=${org} status=${status} remain=${remain} reset=${reset} retryAfter=${retryAfter}`
        );
        throw err;
    }
}
