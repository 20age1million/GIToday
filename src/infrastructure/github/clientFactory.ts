import { requireEnv } from "infrastructure/env/requireEnv.js";
import { Octokit } from "octokit";


export async function getOctokitForGuild(guildID: string) {
    const token = requireEnv("GITHUB_TOKEN");
    return new Octokit({ auth: token });
}
