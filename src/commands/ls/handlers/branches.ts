import { listBranches } from "../../../lib/github/branches.js";
import type { BranchSummary } from "../../../types/github.js";

export async function lsBranches(orgName: string, repoName: string, max: number): Promise<string[]> {
    const summary = await listBranches(orgName, repoName);
    const names = summary.map((bs: BranchSummary) => bs.name);
    return names.slice(0,max);
}   