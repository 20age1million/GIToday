import { CronJob, CronTime } from 'cron';

import type { GuildScheduleConfig } from '../shared/types/schedule.js';
import { existsSync } from 'node:fs';
import type { Client } from 'discord.js';
import { listGuildIds } from './storage-json.js';

type JobInfo = { job: CronJob, running: boolean};
type JobMap = Map<string, JobInfo>;

export class Scheduler {
    // map that store Pair<GuildID, Job>
    private jobs: JobMap = new Map<string, JobInfo>();

    // ctor
    constructor(
        // get config from file
        private readonly getConfig: (guildID: string) => Promise<GuildScheduleConfig | null>,
        // save config to file
        private readonly setConfig: (guildId: string, patch: Partial<GuildScheduleConfig>) => Promise<void>,
        // really function that called at time
        private readonly onTickSend: (guildId: string, channelId: string) => Promise<void>,

        private readonly client: Client, 
    ) {}

    async init() {
        const guildIds = await listGuildIds();
        await this.reloadAll(guildIds);
    }

    private buildCronExpr(hhmm: string) {
        const [h, m] = hhmm.split(':').map(Number);
        return `0 ${m} ${h} * * *`;
    }

    async ensureJob(guildId: string) {
        const cfg = await this.getConfig(guildId);
        if (!cfg || !cfg.channelId) return this.removeJob(guildId);

        const expr = this.buildCronExpr(cfg.time);
        const existing = this.jobs.get(guildId);

        // if this guild has a job, update it
        if (existing) {
            existing.job.setTime(new CronTime(expr, cfg.timeZone));

            if (cfg.enabled && !existing.running) existing.job.start();
            if (!cfg.enabled && existing.running) existing.job.stop();
            return;
        }

        // otherwise, create a new job
        const job = new CronJob(
            expr,
            async () => {const latest = await this.getConfig(guildId);
                const cid = latest?.channelId;
                if (!cid || !latest?.enabled) {
                    console.log(`Skipping scheduled taks for guild ${guildId} because no channelId or not enabled`);
                    return;
                }
                await this.onTickSend(guildId, cid);
            },
            null,
            false,
            cfg.timeZone
        );

        this.jobs.set(guildId, { job, running: false });
        if (cfg.enabled) job.start();
    }

    async removeJob(guildId: string) {
        const job = this.jobs.get(guildId);
        if (job) {
            job.job.stop();
            this.jobs.delete(guildId);
        }
    } 

    async setChannelID(guildId: string, channelId: string) {
        await this.setConfig(guildId, { channelId });
        await this.ensureJob(guildId);
    }

    async setEnabled(guildId: string, enabled: boolean) {
        await this.setConfig(guildId, { enabled });
        await this.ensureJob(guildId);
    }

    async setTime(guildId: string, time: string) {
        await this.setConfig(guildId, { time });
        await this.ensureJob(guildId);
    }

    async setTimeZone(guildId: string, timeZone: string) {
        await this.setConfig(guildId, { timeZone });
        await this.ensureJob(guildId);
    }

    async reloadAll(guildIds: string[]) {
        for (const gid of guildIds) {
            await this.ensureJob(gid);
        }
    }
}
