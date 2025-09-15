import { removeArrayByBlackList } from "../../../lib/convertAuth.js";
import { listOrgContributors } from "../../../lib/github/people.js";

export async function lsPeople(org: string, max: number): Promise<string[]> {
    let names = await listOrgContributors(org);
    names = removeArrayByBlackList(names);
    return names.slice(0, max);
}
