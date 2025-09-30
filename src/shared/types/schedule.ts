// interfaces for schedule task

export type GuildScheduleConfig = {
  enabled: boolean;
  time: string;        // "HH:mm", e.g. "08:00"
  timeZone: string;    // e.g. "America/Toronto"
  channelId: string;
};
