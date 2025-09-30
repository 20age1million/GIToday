// src/lib/github/formatLeaderboard.ts

import type { AuthorAggregate } from "shared/types/github.js";

export type LeaderboardOptions = {
  title?: string;
  top?: number;
  includeDeletions?: boolean;  // 默认不显示
  includeTotal?: boolean;      // 默认不显示
  style?: "text" | "code";
  padAuthor?: number;
  padNum?: number;
  safeBudget?: number;
};

const DEFAULTS: Required<Omit<LeaderboardOptions, "title">> = {
  top: 10,
  includeDeletions: false,
  includeTotal: false,
  style: "code",
  padAuthor: 18,
  padNum: 8,
  safeBudget: 1900,
};

export function formatLeaderboard(
  rows: AuthorAggregate[],
  opts: LeaderboardOptions = {}
): string {
  const {
    top,
    includeDeletions,
    includeTotal,
    style,
    padAuthor,
    padNum,
    safeBudget,
  } = { ...DEFAULTS, ...opts };

  // console.log(rows);

  const title = opts.title?.trim();
  const take = Math.max(1, top);

  // 按 total 排序再截取前 N
  const data = [...rows].sort((a, b) => b.total - a.total).slice(0, take);

  // ====== 固定宽度工具：左对齐 & 右对齐 ======
  const leftPad = (s: string, width: number) =>
    s.length >= width ? s.slice(0, width) : s + " ".repeat(width - s.length);

  // 右对齐字符串（列名用它）
  const rightPad = (s: string, width: number) =>
    s.length >= width ? s.slice(0, width) : " ".repeat(width - s.length) + s;

  // 右对齐数字：**不加千分位**，避免渲染差异
  const numPad = (n: number, width: number) => {
    const raw = String(n); // 不使用 toLocaleString，避免逗号宽度差异
    return raw.length >= width ? raw.slice(0, width) : " ".repeat(width - raw.length) + raw;
  };

  // ====== 表头：所有数字列名使用 rightPad 做右对齐 ======
  const headerCols = [
    leftPad("#", 3),
    leftPad("Author", padAuthor),
    rightPad("add", padNum),
    ...(includeDeletions ? [rightPad("del", padNum)] : []),
    ...(includeTotal ? [rightPad("total", padNum)] : []),
  ];
  const header = headerCols.join("  ");

  const lines: string[] = [];
  if (title) lines.push(title);
  if (style === "code") lines.push("```");

  lines.push(header);
  lines.push("-".repeat(header.length));

  // ====== 行渲染：数字一律用 numPad（右对齐） ======
  let rank = 1;
  for (const r of data) {
    const cols = [
      leftPad(String(rank), 3),
      leftPad(r.authorKey || "unknown", padAuthor),
      numPad(r.additions ?? 0, padNum),
      ...(includeDeletions ? [numPad(r.deletions ?? 0, padNum)] : []),
      ...(includeTotal ? [numPad(r.total ?? (r.additions ?? 0) + (r.deletions ?? 0), padNum)] : []),
    ];
    lines.push(cols.join("  "));
    rank++;
  }

  if (style === "code") lines.push("```");

  let out = lines.join("\n");
  if (out.length > safeBudget) {
    const ellipsis = "\n…(truncated)";
    out = out.slice(0, safeBudget - ellipsis.length) + ellipsis;
  }
  return out;
}
