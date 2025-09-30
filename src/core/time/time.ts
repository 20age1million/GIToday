/**
 * 验证一个字符串是否为 ISO8601 UTC 格式：
 * 格式形如 YYYY-MM-DDTHH:mm:ss(.sss)Z
 * 示例：
 *   2025-09-11T15:30:00Z
 *   2025-09-11T15:30:00.123Z
 * 只接受带 "Z" 的 UTC 时间，不接受有其他时区偏移或省略 Z
 */
export function isISO8601String(s: string): boolean {
  const isoRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d{1,3})?Z$/;
  if (!isoRegex.test(s)) return false;

  const d = new Date(s);
  if (isNaN(d.getTime())) return false;

  // 确保 toISOString() 恰好等同字符串（标准化秒和毫秒部分）
  return d.toISOString() === s;
}

/**
 * 解析形如 "7d" 或 "24h" 的相对时间字符串，只支持 d（天）和 h（小时）。
 * 返回一个时间窗口：{ since, until }，都是 ISO8601 UTC 格式。
 *
 * @param rel — 相对时间字符串，比如 "7d"、"24h"
 */
export function relativeToWindowISO(rel: string): { since: string; until: string } {
  const trimmed = rel.trim().toLowerCase();
  const match = /^(\d+)([dh])$/.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid relative time format: ${rel}. Expected formats like "7d" or "24h".`);
  }

  const numGroup = match[1];
  const unitGroup = match[2];
  if (!numGroup || !unitGroup) {
    throw new Error(`Invalid relative time format, missing number or unit: ${rel}`);
  }

  const num = parseInt(numGroup, 10);
  const unit = unitGroup;

  const now = new Date();
  const until = now.toISOString();

  let sinceDate: Date;
  if (unit === "d") {
    sinceDate = new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
  } else {  // unit === "h"
    sinceDate = new Date(now.getTime() - num * 60 * 60 * 1000);
  }

  const since = sinceDate.toISOString();

  return { since, until };
}
