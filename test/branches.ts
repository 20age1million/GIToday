import { Octokit } from "octokit";
import { requireEnv } from "../src/infrastructure/env/requireEnv.js";

export async function listInstallations(jwt: string) {
  const octokit = new Octokit({
    auth: jwt,
  });

  const res = await octokit.request("GET /app/installations");
  return res.data;
}

const clientID = requireEnv('GITHUB_APP_CLIENT_ID');
    const PRIVATE_KEY =
        Buffer.from(requireEnv('GITHUB_APP_PRIVATE_KEY_BASE64'), 'base64')
            .toString('utf8');

    const appJwt = generateAppJwt(clientID, PRIVATE_KEY);

listInstallations()