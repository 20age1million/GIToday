import { listOrgRepos } from "../../../lib/github/repos.js";
import type { RepoSummary } from "../../../types/github.js";

export async function lsRepos(orgName: string, max: number): Promise<string[]> {
    const summary = await listOrgRepos(orgName);
    const names = summary.map((rs: RepoSummary) => rs.name);
    return names.slice(0,max);
}
