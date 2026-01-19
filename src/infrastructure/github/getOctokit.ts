import jwt from 'jsonwebtoken';
import { requireEnv } from 'infrastructure/env/requireEnv.js';
import { Octokit } from 'octokit';


export async function getOctokit() {
    const clientID = requireEnv('GITHUB_APP_CLIENT_ID');
    const PRIVATE_KEY =
        Buffer.from(requireEnv('GITHUB_APP_PRIVATE_KEY_BASE64'), 'base64')
            .toString('utf8');
    const installationID = Number(requireEnv('GITHUB_APP_INSTALLATION_ID'));

    const jwt = generateAppJwt(clientID, PRIVATE_KEY);

    const installationToken = await getInstallationToken(jwt, installationID);

    return new Octokit({ auth: installationToken.token });
}

function generateAppJwt(clientID: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 600, // 10 minutes
      iss: clientID,
    },
    privateKey,
    { algorithm: "RS256" }
  );
}

async function getInstallationToken(
  jwt: string,
  installationId: number
) {
  const octokit = new Octokit({ auth: jwt });

  const res = await octokit.request(
    "POST /app/installations/{installation_id}/access_tokens",
    {
      installation_id: installationId,
    }
  );

  return {
    token: res.data.token,
    expiresAt: new Date(res.data.expires_at).getTime(),
  };
}