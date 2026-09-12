/** 纯格式化工具（金额、上下文长度、日期） */

import type { Locale } from './i18n';

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', CNY: '¥', EUR: '€' };

export function currencySymbol(currency?: string): string {
  return CURRENCY_SYMBOLS[currency || 'USD'] ?? '$';
}

/** 金额格式化：最多 4 位有效数字，去除浮点噪声 */
export function formatMoney(symbol: string, value: number): string {
  const rounded = Number(value.toPrecision(4));
  return `${symbol}${rounded}`;
}

/** token 价格单元格文案（每 1M tokens） */
export function formatTokenPrice(symbol: string, value: number | null): string {
  if (value === null) return '—';
  return formatMoney(symbol, value);
}

/** 上下文窗口格式化：十进制整除优先（128000 → 128K、1000000 → 1M），二进制值按 1024 换算（131072 → 128K） */
export function formatContext(tokens?: number): string {
  if (!tokens || tokens <= 0) return '—';
  const base = tokens % 1000 === 0 ? 1000 : tokens % 1024 === 0 ? 1024 : 1000;
  const mega = base * base;
  if (tokens >= mega) {
    const millions = tokens / mega;
    return `${Number.isInteger(millions) ? millions : Number(millions.toFixed(1))}M`;
  }
  if (tokens >= base) {
    const thousands = tokens / base;
    return `${Number.isInteger(thousands) ? thousands : Number(thousands.toFixed(1))}K`;
  }
  return String(tokens);
}

/** UI 语言 → Intl 语言标签 */
export const INTL_LOCALES: Record<Locale, string> = { en: 'en', zh: 'zh-CN', ja: 'ja' };

const DATE_ONLY_RE = /^\d{4}-\d{2}(-\d{2})?$/;
const DAY_MS = 86_400_000;

/** 发布后视为“新模型”的天数 */
export const NEW_MODEL_WINDOW_DAYS = 30;

/**
 * release_date（YYYY-MM-DD / YYYY-MM，按 UTC 解析）距 now 是否不超过 NEW_MODEL_WINDOW_DAYS 天。
 * 晚于 now 的日期（预告发布）同样视为新模型；缺失或非法日期（解析为 NaN）视为非新模型。
 */
export function isNewRelease(releaseDate: string | undefined, now: number): boolean {
  if (!releaseDate || !DATE_ONLY_RE.test(releaseDate)) return false;
  return now - Date.parse(releaseDate) <= NEW_MODEL_WINDOW_DAYS * DAY_MS;
}

/**
 * ISO 时间戳或日期 → 本地化简洁日期（Aug 6, 2026 / 2026年8月6日）。
 * 纯日期值（YYYY-MM-DD / YYYY-MM）按 UTC 解释以免跨时区回退一天；年月值只显示到月。
 */
export function formatDate(value: string, locale: Locale = 'en'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dateOnly = DATE_ONLY_RE.exec(value);
  const options: Intl.DateTimeFormatOptions = !dateOnly
    ? { dateStyle: 'medium' }
    : dateOnly[1]
      ? { dateStyle: 'medium', timeZone: 'UTC' }
      : { year: 'numeric', month: 'short', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], options).format(date);
}

/** 本地化千分位整数（1,050,000） */
export function formatNumber(value: number, locale: Locale = 'en'): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale]).format(value);
}
