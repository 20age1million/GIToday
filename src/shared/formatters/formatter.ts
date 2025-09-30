import { formatList } from "./formatList.js";
import { formatLeaderboard, type LeaderboardOptions } from "./formatLeaderboard.js";
import type {
  AuthorAggregate,
} from "shared/types/github.js";



export class Formatter {
    public static list(items: string[], title?: string): string {
        return formatList(items, title);
    }

    public static leaderboard(
    rows: AuthorAggregate[],
    opts: LeaderboardOptions = {}
    ): string {
        return formatLeaderboard(rows, opts);
    }
}
