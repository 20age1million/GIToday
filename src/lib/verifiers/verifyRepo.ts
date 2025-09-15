import { listOrgRepos } from "../github/repos.js";
import type { RepoSummary } from "../../types/github.js";

export async function verifyRepo(org: string, repo: string): Promise<Boolean> {
    const repos = await listOrgRepos(org)
    const repoNames = repos.map((rs: RepoSummary) => rs.name); 
    return repoNames.includes(repo);
}
