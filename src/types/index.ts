// === 核心数据结构类型定义 ===

/** 基础模型信息 */
export interface ModelBase {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
  icon?: string;
  release_date?: string;
  last_updated?: string;
  knowledge?: string;
  open_weights?: boolean;
}

/** 模型能力标志 */
export interface ModelCapabilities {
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  temperature?: boolean;
}

/** 模型输入输出限制 */
export interface ModelLimits {
  context?: number;
  output?: number;
}

/** 模型成本信息 */
export interface ModelCost {
  input?: number;
  output?: number;
  cache_read?: number;
}

/** 模型支持的模态 */
export interface ModelModalities {
  input?: string[];
  output?: string[];
}

/** 完整模型数据 */
export interface Model extends ModelBase, ModelCapabilities {
  limit?: ModelLimits;
  cost?: ModelCost;
  modalities?: ModelModalities;
}

/** 基础提供商信息 */
export interface ProviderBase {
  id: string;
  name?: string;
  description?: string;
  api?: string;
  doc?: string;
  icon?: string;
  iconURL?: string;
  lobeIcon?: string;
}

/** 完整提供商数据 */
export interface Provider extends ProviderBase {
  models: Record<string, Model>;
}

// === 源数据类型 ===

/** models.dev API 响应格式 */
export type SourceData = Record<string, Provider>;

// === 配置文件类型 ===

/** 策略配置 */
export interface PolicyConfig {
  providers?: Record<string, { auto?: boolean }>;
  models?: Record<string, { auto?: boolean }>;
}

/** 覆写配置 */
export interface OverrideConfig {
  providers?: Record<string, Partial<ProviderBase>>;
  models?: Record<string, Partial<Model>>;
}

// === 输出接口类型 ===

/** 提供商索引项 */
export interface ProviderIndexItem {
  id: string;
  name: string;
  api?: string | undefined;
  doc?: string | undefined;
  icon?: string | undefined;
  iconURL?: string | undefined;
  lobeIcon?: string | undefined;
  modelCount: number;
}

/** 模型索引项 */
export interface ModelIndexItem {
  id: string;
  providerId: string;
  name: string;
  updated?: string | undefined;
  flags: {
    attachment: boolean;
    reasoning: boolean;
    tool_call: boolean;
  };
}

/** 主索引输出 */
export interface IndexOutput {
  providers: ProviderIndexItem[];
  models: ModelIndexItem[];
}

/** 提供商索引输出 */
export interface ProvidersOutput {
  providers: ProviderIndexItem[];
}

/** 完整数据输出 (models.dev 格式) */
export type AllModelsOutput = Record<string, Provider>;

// === NewAPI 相关类型 ===

/** NewAPI 供应商数据 */
export interface NewApiVendor {
  name: string;
  description: string;
  icon: string;
  status: number;
}

/** NewAPI 模型数据 */
export interface NewApiModel {
  model_name: string;
  description: string;
  tags: string;
  vendor_id: null;
  endpoints: null;
  status: number;
  name_rule: number;
  icon: string;
}

/** NewAPI 价格比率 */
export interface NewApiRatios {
  model: number;
  completion: number | null;
  cache: number | null;
}

/** NewAPI 价格配置 */
export interface NewApiPriceConfig {
  data: {
    cache_ratio: Record<string, number>;
    completion_ratio: Record<string, number>;
    model_ratio: Record<string, number>;
  };
  message: string;
  success: boolean;
}

/** NewAPI 同步载荷 */
export interface NewApiSyncPayload {
  vendors: NewApiVendor[];
  models: NewApiModel[];
}

// === 构建清单类型 ===

/** 构建统计 */
export interface BuildStats {
  providers: number;
  models: number;
  filesChanged: number;
  dryRun: boolean;
}

/** 构建清单 */
export interface BuildManifest {
  version: number;
  generatedAt: string;
  sourceHash: string;
  overridesHash: string;
  policyHash: string;
  stats: BuildStats;
  warnings?: string[] | undefined;
}

// === 内部处理类型 ===

/** 规范化数据 */
export interface NormalizedData {
  providers: Record<string, Provider>;
}

/** 构建配置 */
export interface BuildConfig {
  dryRun: boolean;
  force: boolean;
  docsMdOnly: boolean;
  apiOnly: boolean;
}

/** 模型键 */
export type ModelKey = `${string}/${string}`;

/** 工具函数类型 */
export interface ModelKeyHelper {
  create: (providerId: string, modelId: string) => ModelKey;
  parse: (key: ModelKey) => { providerId: string; modelId: string };
}
