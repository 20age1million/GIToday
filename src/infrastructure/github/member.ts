import type { ListOptions } from "../../shared/types/github.js";
import { Octokit } from "octokit";


export async function listMembers(octokit: Octokit, org: string, opts?: ListOptions): Promise<string[]> {
    const members = await octokit.paginate("GET /orgs/{org}/members", {
        org,
        per_page: 100
    });

    // 映射 login + 去重
    const logins = Array.from(
        new Set(
            members
            .map((m) => m.login)
            .filter(Boolean)
        )
    );

    return logins.sort();
}
