import { collectOrgReport } from "./report-org.js"
import { collectRepoReport } from "./report-repo.js"
import type { AuthorAggregate, ListOptions } from "shared/types/github.js";


export class Report {
    public static async collectOrgReport(
        guildID: string,
        window: { since: string; until: string },
        opts: ListOptions = {}
    ): Promise<{ byRepo: Record<string, AuthorAggregate[]>; summary: AuthorAggregate[] }> {
        return collectOrgReport(guildID, window, opts);
    }

    public static async collectRepoReport(
        guildID: string,
        repo: string,
        window: { since: string; until: string },
        opts?: { perPage?: number; concurrency?: number; ignoreMerges?: boolean }
    ): Promise<AuthorAggregate[]> {
        return collectRepoReport(guildID, repo, window, opts);
    }
}