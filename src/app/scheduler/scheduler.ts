import { CronJob, CronTime } from 'cron';

import type { GuildScheduleConfig } from 'shared/types/schedule.js';
import { Guild, type Client } from 'discord.js';
import { Tasks } from 'infrastructure/db/tasks.js';
import { Messenger } from './messenger.js';
import { client } from 'app/discord/client.js';
import { GuildInfo } from 'infrastructure/db/guildInfo.js';
import { Report } from 'core/reports/report.js';
import { relativeToWindowISO } from 'core/time/time.js';
import { Logger } from 'infrastructure/log/log.js';
import type { AuthorAggregate } from 'shared/types/github.js';
import { ConvertAuth } from 'core/people/convertAuth.js';
import { Formatter } from 'shared/formatters/formatter.js';

class Scheduler {
    // map that store Pair<GuildID, Job>
    private client: Client;

    private jobs = new Map<string, CronJob>();
    private messenger: Messenger;
    private onTickSend = async (guildID: string) => {
        const orgName = (await GuildInfo.getGitInfo(guildID)).org;
        if (!orgName) {
            Logger.error("Scheduler", `No orgName configured for guild ${guildID}`);
            return;
        }

        let summary = (await Report.collectOrgReport(guildID, relativeToWindowISO("1d"))).summary

        const converter = await ConvertAuth.create(client, await client.guilds.fetch(guildID) ?? undefined);
        summary = await converter.convertAuthAgg(summary);

        let message: string;
        const title = `🏆 Daily Leaderboard for ${orgName} - `;
        let displayedTime = "last 1d";
        if (!summary.length) {
            message =`No commits in \`${orgName}\` within \`${displayedTime}\`.`;
        } else {
            message = Formatter.leaderboard(summary, { title: title });
        }
        await this.messenger.send((await Tasks.get(guildID)).channelId , message);
    };

    constructor(client: Client) {
        this.client = client;
        this.messenger = new Messenger(client);
    }

    static async create(client: Client) {
        const scheduler = new Scheduler(client);
        scheduler.reloadAll()
        return scheduler;
    }

    private buildCronExpr(hhmm: string) {
        const [h, m] = hhmm.split(':').map(Number);
        return `0 ${m} ${h} * * *`;
    }

    async ensureJob(guildId: string) {
        const cfg = await Tasks.get(guildId);
        if (!cfg || !cfg.channelId) return this.removeJob(guildId);

        const expr = this.buildCronExpr(cfg.time);
        const existing = this.jobs.get(guildId);

        // if this guild has a job, update it
        if (existing) {
            existing.setTime(new CronTime(expr, cfg.timeZone));

            if (cfg.enabled) existing.start();
            if (!cfg.enabled) existing.stop();
            return;
        }

        // otherwise, create a new job
        const job = new CronJob(
            expr,
            async () => {const latest = await Tasks.get(guildId);
                const cid = latest?.channelId;
                if (!cid || !latest?.enabled) {
                    Logger.warn("Scheduler", `Skipping scheduled taks for guild ${guildId} because no channelId or not enabled`);
                    return;
                }
                await this.onTickSend(guildId);
            },
            null,
            false,
            cfg.timeZone
        );

        this.jobs.set(guildId, job);
        if (cfg.enabled) job.start();
    }

    async removeJob(guildId: string) {
        const job = this.jobs.get(guildId);
        if (job) {
            job.stop();
            this.jobs.delete(guildId);
        }
    } 

    async setChannelID(guildId: string, channelId: string) {
        await Tasks.set(guildId, { channelId });
        await this.ensureJob(guildId);
    }

    async setEnabled(guildId: string, enabled: boolean) {
        await Tasks.set(guildId, { enabled });
        await this.ensureJob(guildId);
    }

    async setTime(guildId: string, time: string) {
        await Tasks.set(guildId, { time });
        await this.ensureJob(guildId);
    }

    async setTimeZone(guildId: string, timeZone: string) {
        await Tasks.set(guildId, { timeZone });
        await this.ensureJob(guildId);
    }

    async reloadAll() {
        const guildIds = await Tasks.listGuilds();

        for (const gid of guildIds) {
            await this.ensureJob(gid);
        }
    }
}

export const scheduler: Scheduler = await Scheduler.create(client);