/** 静态 API 数据访问层（相对路径，兼容子路径与根路径部署） */

export interface ModelCost {
  currency?: string;
  /** 价格键为数字；少数复合键（tiers 数组、context_over_200k 对象）为结构化数据 */
  [key: string]: unknown;
}

export interface Model {
  id: string;
  name?: string;
  description?: string;
  release_date?: string;
  last_updated?: string;
  reasoning?: boolean;
  tool_call?: boolean;
  limit?: { context?: number; output?: number };
  modalities?: { input?: string[]; output?: string[] };
  cost?: ModelCost;
}

export interface Provider {
  id: string;
  name?: string;
  api?: string;
  doc?: string;
  iconURL?: string;
  models: Record<string, Model>;
}

export interface ProviderIndexItem {
  id: string;
  name: string;
  doc?: string;
  iconURL?: string;
  modelCount: number;
}

const API_BASE = './api';

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

/** 与构建器 sanitizeFileSegment 一致的文件名映射 */
function sanitizeFileSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9\-_.]/g, '_');
}

/** 同源镜像的供应商 logo 地址（构建时下载到 dist/api/logos/） */
export function providerLogoURL(id: string): string {
  return `${API_BASE}/logos/${sanitizeFileSegment(id)}.svg`;
}

export function fetchProviders(): Promise<{ providers: ProviderIndexItem[] }> {
  return fetchJSON('providers.json');
}

const providerCache = new Map<string, Promise<Provider>>();

/** 按需加载单个供应商（含全部模型），带内存缓存 */
export function fetchProvider(id: string): Promise<Provider> {
  let cached = providerCache.get(id);
  if (!cached) {
    cached = fetchJSON<Provider>(`providers/${sanitizeFileSegment(id)}.json`);
    cached.catch(() => providerCache.delete(id));
    providerCache.set(id, cached);
  }
  return cached;
}

interface NewApiRatioConfig {
  data?: { billing_expr?: Record<string, string> };
}

const billingExprCache = new Map<string, Promise<Record<string, string>>>();

/** 供应商的 new-api 表达式计费映射（modelId → expr）；缺失时返回空映射 */
export function fetchBillingExpr(id: string): Promise<Record<string, string>> {
  let cached = billingExprCache.get(id);
  if (!cached) {
    cached = fetchJSON<NewApiRatioConfig>(
      `newapi/providers/${sanitizeFileSegment(id)}/ratio_config-v1-base.json`,
    ).then(
      (config) => config.data?.billing_expr ?? {},
      () => ({}),
    );
    billingExprCache.set(id, cached);
  }
  return cached;
}

export interface Manifest {
  generatedAt?: string;
  stats?: { providers?: number; models?: number };
}

export function fetchManifest(): Promise<Manifest | null> {
  return fetchJSON<Manifest>('manifest.json').catch(() => null);
}
