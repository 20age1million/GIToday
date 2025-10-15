import { requireEnv } from "infrastructure/env/requireEnv.js";
import { Octokit } from "octokit";


export async function getOctokitForGuild(guildID: string) {
    const token = requireEnv("GITHUB_TOKEN"); // plceholder for now, later we can map guildID to different tokens if needed
    return new Octokit({ auth: token });
}
