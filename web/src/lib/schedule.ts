/** 时段定价（cost.schedule）的展示与当前时段判定 */

import { INTL_LOCALES } from './format';
import type { Locale } from './i18n';

export interface ScheduleWindow {
  name: string;
  /** 0=周日 … 6=周六 */
  weekdays?: number[];
  /** "HH:MM-HH:MM"，结束不含；结束早于开始表示跨午夜 */
  hours?: string[];
  [key: string]: unknown;
}

export interface Schedule {
  timezone: string;
  fallback: string;
  windows: ScheduleWindow[];
}

const HOUR_RANGE_RE = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function isSchedule(value: unknown): value is Schedule {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Schedule>;
  return (
    typeof candidate.timezone === 'string' &&
    typeof candidate.fallback === 'string' &&
    Array.isArray(candidate.windows) &&
    candidate.windows.every((window) => typeof window?.name === 'string')
  );
}

/** "HH:MM-HH:MM" → 自午夜起的分钟数区间 */
function parseHourRange(text: string): [number, number] | null {
  const match = HOUR_RANGE_RE.exec(text);
  if (!match) return null;
  const [sh, sm, eh, em] = match.slice(1).map(Number);
  return [sh * 60 + sm, eh * 60 + em];
}

/** 连续星期合并为区间：[1,2,3,4,5] → [[1,5]] */
function weekdayRuns(weekdays: number[]): [number, number][] {
  const runs: [number, number][] = [];
  for (const day of [...new Set(weekdays)].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && last[1] === day - 1) last[1] = day;
    else runs.push([day, day]);
  }
  return runs;
}

/** 窗口条件的可读描述："Mon–Fri 01:00–04:00, 06:00–10:00 (UTC)" */
export function describeWindow(window: ScheduleWindow, timezone: string, locale: Locale): string {
  const parts: string[] = [];

  if (window.weekdays?.length) {
    const names = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
      weekday: 'short',
      timeZone: 'UTC',
    });
    // 2026-01-04 为周日，与 0=周日 的编号对齐
    const name = (day: number) => names.format(new Date(Date.UTC(2026, 0, 4 + day)));
    parts.push(
      weekdayRuns(window.weekdays)
        .map(([from, to]) => (from === to ? name(from) : `${name(from)}–${name(to)}`))
        .join(', '),
    );
  }

  if (window.hours?.length) {
    parts.push(window.hours.map((range) => range.replace('-', '–')).join(', '));
  }

  return `${parts.join(' ')} (${timezone})`;
}

/** 当前时刻（按 timezone 折算）是否落在窗口内；时区无效时视为不在窗口内 */
export function isWindowActive(window: ScheduleWindow, timezone: string, now: Date): boolean {
  let weekday: number | undefined;
  let minutes = 0;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(now);
    for (const part of parts) {
      if (part.type === 'weekday') weekday = WEEKDAY_INDEX[part.value];
      if (part.type === 'hour') minutes += Number(part.value) * 60;
      if (part.type === 'minute') minutes += Number(part.value);
    }
  } catch {
    return false;
  }
  if (weekday === undefined) return false;

  if (window.weekdays?.length && !window.weekdays.includes(weekday)) return false;
  if (!window.hours?.length) return true;
  return window.hours.some((text) => {
    const range = parseHourRange(text);
    if (!range) return false;
    const [start, end] = range;
    return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
  });
}
