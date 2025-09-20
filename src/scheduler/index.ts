// src/scheduler/index.ts
import { Scheduler } from './schedule.js';
import { getConfig, saveConfig, listGuildIds } from './storage-json.js';
import { Messenger } from './messenger.js';
import type { Client } from 'discord.js';

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
  const msg = `📣 Scheduled daily message for guild ${guildId}`;
  await messenger.send(channelId, msg);
});

export async function initScheduler() {
  const guildIds = await listGuildIds();
  await scheduler.reloadAll(guildIds);
}

export { scheduler };
