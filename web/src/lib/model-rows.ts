/** 模型列表行：搜索过滤 + 排序 + 派生展示数据（表格视图与卡片视图共用） */

import type { Model } from './api';
import { isNewRelease } from './format';
import type { Locale, Translator } from './i18n';
import { parseModelPricing, type ModelPricing } from './pricing';

export type SortKey = 'name' | 'released' | 'input' | 'output';
export type SortDirection = 1 | -1;

/** 首次选择某列时的方向：日期默认最新在前，其余升序 */
export const DEFAULT_DIRECTION: Record<SortKey, SortDirection> = {
  name: 1,
  released: -1,
  input: 1,
  output: 1,
};

export interface ModelRow {
  model: Model;
  pricing: ModelPricing;
  expr: string | undefined;
  isNew: boolean;
}

export interface ModelRowsOptions {
  query: string;
  billingExpr: Record<string, string> | null;
  sortKey: SortKey;
  direction: SortDirection;
  t: Translator;
  locale: Locale;
}

function matches(model: Model, normalizedQuery: string): boolean {
  return (
    !normalizedQuery ||
    model.id.toLowerCase().includes(normalizedQuery) ||
    (model.name || '').toLowerCase().includes(normalizedQuery)
  );
}

/** 排序取值：ISO 日期按字符串比较即为时间序 */
function sortValue(row: ModelRow, key: SortKey): string | number | null {
  if (key === 'name') return row.model.id;
  if (key === 'released') return row.model.release_date ?? null;
  return row.pricing.base[key];
}

export function buildModelRows(models: Model[], options: ModelRowsOptions): ModelRow[] {
  const { query, billingExpr, sortKey, direction, t, locale } = options;
  const normalized = query.trim().toLowerCase();
  const now = Date.now();

  const rows = models
    .filter((model) => matches(model, normalized))
    .map<ModelRow>((model) => ({
      model,
      pricing: parseModelPricing(model.cost, t, locale),
      expr: billingExpr?.[model.id],
      isNew: isNewRelease(model.release_date, now),
    }));

  // 缺失值不论方向始终排在末尾；同值按 ID 稳定排序
  rows.sort((a, b) => {
    const av = sortValue(a, sortKey);
    const bv = sortValue(b, sortKey);
    const byId = a.model.id.localeCompare(b.model.id);
    if (av === null && bv === null) return byId;
    if (av === null) return 1;
    if (bv === null) return -1;
    const order =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
    return direction * order || byId;
  });
  return rows;
}
