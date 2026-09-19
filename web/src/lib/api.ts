/** 静态 API 数据访问层（相对路径，兼容子路径与根路径部署） */

import type { ModelCost, ProviderBillingRule } from '@billing/cost';

import type { Locale } from './i18n';

export type { ModelCost, ProviderBillingRule };

/** 推理强度选项（models.dev reasoning_options） */
export interface ReasoningOption {
  type: string;
  values?: unknown[];
}

export interface Model {
  id: string;
  name?: string;
  description?: string;
  /** 模型系列（如 "qwen"） */
  family?: string;
  /** 生命周期状态（"deprecated" / "beta"），缺省为正常可用 */
  status?: string;
  release_date?: string;
  last_updated?: string;
  /** 知识截止日期（ISO） */
  knowledge?: string;
  reasoning?: boolean;
  reasoning_options?: ReasoningOption[];
  tool_call?: boolean;
  structured_output?: boolean;
  attachment?: boolean;
  temperature?: boolean;
  open_weights?: boolean;
  limit?: { context?: number; input?: number; output?: number };
  modalities?: { input?: string[]; output?: string[] };
  cost?: ModelCost;
}

export interface Provider {
  id: string;
  name?: string;
  api?: string;
  doc?: string;
  iconURL?: string;
  /** 端点结算货币（缺省 USD） */
  currency?: string;
  /** 订阅套餐端点（Token Plan / Coding Plan）：用量从预付额度抵扣，逐 token 价目不适用 */
  subscription?: boolean;
  /** new-api 计费规则（思考开关、1h 缓存写倍数、聚合优先级） */
  billing?: ProviderBillingRule;
  models: Record<string, Model>;
}

export interface ProviderIndexItem {
  id: string;
  name: string;
  doc?: string;
  iconURL?: string;
  currency?: string;
  subscription?: boolean;
  billing?: ProviderBillingRule;
  modelCount: number;
}

/** 全局模型索引项（index.json），用于跨供应商搜索 */
export interface ModelIndexItem {
  id: string;
  providerId: string;
  name: string;
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

/** 英文为基准数据（根路径），其余语言走 i18n 子树 */
function localePath(locale: Locale, path: string): string {
  return locale === 'en' ? path : `i18n/${locale}/${path}`;
}

export function fetchProviders(locale: Locale): Promise<{ providers: ProviderIndexItem[] }> {
  return fetchJSON(localePath(locale, 'providers.json'));
}

const providerCache = new Map<string, Promise<Provider>>();

/** 按需加载单个供应商（含全部模型），按语言维度内存缓存 */
export function fetchProvider(locale: Locale, id: string): Promise<Provider> {
  const cacheKey = `${locale}:${id}`;
  let cached = providerCache.get(cacheKey);
  if (!cached) {
    cached = fetchJSON<Provider>(localePath(locale, `providers/${sanitizeFileSegment(id)}.json`));
    cached.catch(() => providerCache.delete(cacheKey));
    providerCache.set(cacheKey, cached);
  }
  return cached;
}

const modelIndexCache = new Map<Locale, Promise<ModelIndexItem[]>>();

/** 全部模型的轻量索引，仅在用户发起全局搜索时按语言懒加载 */
export function fetchModelIndex(locale: Locale): Promise<ModelIndexItem[]> {
  let cached = modelIndexCache.get(locale);
  if (!cached) {
    cached = fetchJSON<{ models: ModelIndexItem[] }>(localePath(locale, 'index.json')).then(
      (index) => index.models,
    );
    cached.catch(() => modelIndexCache.delete(locale));
    modelIndexCache.set(locale, cached);
  }
  return cached;
}

export interface Manifest {
  generatedAt?: string;
  stats?: { providers?: number; models?: number };
  /** 静态 NewAPI 预设的生成假设：非美元价目换算所用汇率（每 1 USD 的货币数量） */
  newapi?: { exchangeRates?: Record<string, number> };
}

export function fetchManifest(): Promise<Manifest | null> {
  return fetchJSON<Manifest>('manifest.json').catch(() => null);
}

let allProvidersCache: Promise<Record<string, Provider>> | null = null;

/** 全部供应商及其模型（all.json，约 0.5 MB），仅在导出聚合 ratio_config 时按需加载 */
export function fetchAllProviders(): Promise<Record<string, Provider>> {
  if (!allProvidersCache) {
    allProvidersCache = fetchJSON<Record<string, Provider>>('all.json');
    allProvidersCache.catch(() => {
      allProvidersCache = null;
    });
  }
  return allProvidersCache;
}
