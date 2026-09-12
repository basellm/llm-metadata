/** 大小写不敏感的 ID / 名称子串匹配（供应商与模型搜索共用） */

export interface Searchable {
  id: string;
  name?: string;
}

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesQuery(item: Searchable, normalizedQuery: string): boolean {
  return (
    !normalizedQuery ||
    item.id.toLowerCase().includes(normalizedQuery) ||
    (item.name ?? '').toLowerCase().includes(normalizedQuery)
  );
}

/** 前缀命中优先于子串命中（用于结果排序） */
export function matchRank(item: Searchable, normalizedQuery: string): number {
  return item.id.toLowerCase().startsWith(normalizedQuery) ||
    (item.name ?? '').toLowerCase().startsWith(normalizedQuery)
    ? 0
    : 1;
}
