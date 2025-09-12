// scripts/branches.ts
import "dotenv/config";
import { listBranches } from "../src/lib/github/branches.js";

(async () => {
  const org = process.env.TEST_ORG || "20age1million";
  const branches = await listBranches(org, "who-will-pay-expense-tracker");
  console.log(`branches count = ${branches.length}`);
  console.log(branches.slice(0, 5));
})();
