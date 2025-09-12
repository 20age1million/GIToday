// scripts/report-repos.ts
import "dotenv/config";
import { collectOrgReport } from "../src/lib/github/report-org"

(async () => {
  const org = process.env.TEST_ORG || "20age1million";

    const now = new Date();
    const since = addDays(now, -20);

  const data = await collectOrgReport(org, { since: since.toISOString(), until: now.toISOString() });
  console.log(data.summary.slice(0, 10));
})();


// 加减天数／小时的 helper
function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());  // 克隆一份
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date.getTime());
  d.setUTCHours(d.getUTCHours() + hours);
  return d;
}

function subtractHours(date: Date, hours: number): Date {
  return addHours(date, -hours);
}
