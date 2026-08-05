/** 纯格式化工具（金额、上下文长度、日期） */

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

/** ISO 时间戳 → 简洁日期（Aug 6, 2026） */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}
