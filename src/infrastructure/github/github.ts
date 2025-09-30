import { listOrgRepos } from "./repos.js";
import { listBranches } from "./branches.js";
import { listCommits } from "./commits.js";
import { listMembers } from "./member.js";
import { getOctokitForGuild } from "./clientFactory.js";

import { GuildInfo } from "infrastructure/db/guildInfo.js";

import { Logger } from "infrastructure/log/log.js";

import type { 
    RepoSummary, 
    BranchSummary,
    CommitSummary, 
    ListOptions } from "../../shared/types/github.js";


import { Octokit } from "octokit";


export class GitHub {
    private constructor(
        public readonly octokit: Octokit,
        public readonly org: string
    ) {}

    public static async create(guildID: string): Promise<GitHub> {
        const oct = await getOctokitForGuild(guildID);
        const org = (await GuildInfo.getGitInfo(guildID)).org;
        if (!org) {
            throw new Error(`GitHub.create - No organization configured for guild ${guildID}`);
        } 
        return new GitHub(oct, org);
    }

    public async listOrgRepos(
        opts: ListOptions = {}
    ): Promise<RepoSummary[]> {
        try {
            return listOrgRepos(this.octokit, this.org, opts);
        } catch (err: any) {
            Logger.error("GitHub", `listOrgRepos - Failed to list repos for org ${this.org}: ${(err as any)?.message ?? err}`);
            throw err;
        }
    }

    public async listBranches(
        repo: string,
        opts?: { perPage?: number }
    ): Promise<BranchSummary[]> {
        try {
            return listBranches(this.octokit, this.org, repo, opts);
        } catch (err: any) {
            Logger.error("GitHub", `listBranches - Failed to list branches for repo ${this.org}/${repo}: ${(err as any)?.message ?? err}`);
            throw err;
        }
    }

    public async listCommits(
        repo: string,
        branch: string,
        window: { since: string; until: string },
        opts?: { perPage?: number; ignoreMerges?: boolean }
    ): Promise<CommitSummary[]> {
        try {
            return listCommits(this.octokit, this.org, repo, branch, window, opts);
        } catch (err: any) {
            Logger.error("GitHub", `listCommits - Failed to list commits for ${this.org}/${repo}@${branch}: ${(err as any)?.message ?? err}`);
            throw err;
        }
    }

    public async listMembers(
        opts?: ListOptions
    ): Promise<string[]> {
        try {
            return listMembers(this.octokit, this.org, opts);
        } catch (err: any) {
            Logger.error("GitHub", `listMembers - Failed to list members for org ${this.org}: ${(err as any)?.message ?? err}`);
            throw err;
        }
    }

    public async verifyRepo(repo: string): Promise<Boolean> {
        const repos = await this.listOrgRepos();
        const repoNames = repos.map((rs: RepoSummary) => rs.name); 
        return repoNames.includes(repo);
    }
}