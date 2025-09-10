// scripts/smoke-repos.ts
import "dotenv/config";
import { safeListOrgRepos } from "../src/lib/github/repos.js";

(async () => {
  const org = process.env.TEST_ORG || "20age1million";
  const repos = await safeListOrgRepos(org, { /* type: "all" */ });
  console.log(`repos count = ${repos.length}`);
  console.log(repos.slice(0, 5));
})();
