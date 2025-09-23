// src/scheduler/index.ts
import { Scheduler } from './schedule.js';
import { getConfig, saveConfig, listGuildIds } from './storage-json.js';
import { Messenger } from './messenger.js';
import type { Client } from 'discord.js';
import { collectOrgReport } from '../lib/github/report-org.js';
import { relativeToWindowISO } from '../lib/time.js';
import { requireEnv } from '../lib/requireEnv.js';
import type { AuthorAggregate } from '../types/github.js';
import { convertAuth, mergeSameNamesInAuthAgg, removeAuthAggByBlackList} from '../lib/people-configs/convertAuth.js';
import { formatLeaderboard } from '../lib/formatters/formatLeaderboard.js';

// 你需要在某处传入你的 discord.js Client 实例
let messenger: Messenger; 

// 初始化函数：传入 client 实例
export function initMessenger(client: Client) {
  messenger = new Messenger(client);
}

// 创建 scheduler 实例
const scheduler = new Scheduler(getConfig, saveConfig, async (guildId: string, channelId: string) => {

    if (!messenger) {
      throw new Error('Messenger not initialized');
    }

    const orgName = requireEnv("GITHUB_ORG");

    let summary = (await collectOrgReport(orgName, relativeToWindowISO("1d"))).summary

    // map to same name
    summary.map(async (aa: AuthorAggregate) => {
        aa.authorKey = await convertAuth(aa.authorKey);
        return aa;
    });
    summary = mergeSameNamesInAuthAgg(summary);
    summary = await removeAuthAggByBlackList(summary);

    let message: string;
    const title = `🏆 Daily Leaderboard for ${orgName} - `;
    let displayedTime = "last 1d";
    if (!summary.length) {
        message =`No commits in \`${orgName}\` within \`${displayedTime}\`.`;
    } else {
        message = formatLeaderboard(summary, { title: title});
    }
    await messenger.send(channelId, message);
});

export async function initScheduler() {
  const guildIds = await listGuildIds();
  await scheduler.reloadAll(guildIds);
}

export { scheduler };
