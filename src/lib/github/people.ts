import type { ListOptions } from "../../types/github.js";
import { octokit } from "./client.js";


function isBotLike(login?: string, type?: string): boolean {
  if (!login && !type) return false;
  if (type === "Bot") return true;
  if (login && /\[bot]$/i.test(login)) return true;
  return false;
}

export async function listOrgContributors(org: string, opts?: ListOptions): Promise<string[]> {
    const members = await octokit.paginate("GET /orgs/{org}/members", {
        org,
        per_page: 100
    });

    // 映射 login + 过滤 bot + 去重
    const logins = Array.from(
        new Set(
            members
            .map((m) => m.login)
            .filter(Boolean)
            .filter((login) => !isBotLike(login, (members as any)?.type))
        )
    );

    return logins.sort();
}
