// scripts/smoke-repos.ts
import "dotenv/config";
import { listOrgRepos } from "../src/lib/github/repos.js";

(async () => {
  const org = process.env.TEST_ORG || "20age1million";
  const repos = await listOrgRepos(org, { /* type: "all" */ });
  console.log(`repos count = ${repos.length}`);
  console.log(repos.slice(0, 5));
})();
