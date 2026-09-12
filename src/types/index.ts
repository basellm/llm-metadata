import type { CostFamily } from '../constants/cost-families.js';

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

/** 各计费家族的价格单元（USD 或 cost.currency 指定货币 / 1M tokens） */
export type CostFamilyCells = Partial<Record<CostFamily, number>>;

/** 结构化上下文阶梯条目（价格在 tier.size tokens 以上生效） */
export interface ModelCostTier extends CostFamilyCells {
  tier?: { size?: number; type?: string };
}

/**
 * 时段定价窗口（覆写数据）。窗口内给出的价格覆盖基础价，未给出的家族沿用基础价；
 * 基础成本含阶梯时，覆盖价格的窗口必须自带 tiers。
 */
export interface CostScheduleWindow extends CostFamilyCells {
  /** 档位名（写入 tier() 名称，如 "peak"） */
  name: string;
  /** 生效星期（0=周日 … 6=周六）；缺省为每天 */
  weekdays?: number[];
  /** 生效时间区间 "HH:MM-HH:MM"（结束不含；结束早于开始表示跨午夜）；缺省为全天 */
  hours?: string[];
  tiers?: ModelCostTier[];
}

/** 时段定价：按 IANA 时区评估，窗口按顺序匹配，均不命中时采用基础价 */
export interface CostSchedule {
  timezone: string;
  /** 基础价档位名（如 "off_peak"） */
  fallback: string;
  windows: CostScheduleWindow[];
}

/**
 * 模型成本信息（与 models.dev Cost 对齐，另含仓库扩展）。
 * tiers 中价格在 tier.size 以上生效；context_over_200k 为同一信息的遗留表示（tiers 存在时忽略）。
 */
export interface ModelCost extends CostFamilyCells {
  currency?: 'CNY' | 'USD' | 'EUR';
  tiers?: ModelCostTier[];
  context_over_200k?: CostFamilyCells;
  schedule?: CostSchedule;
  /** 按图计费（USD / 张） */
  per_image?: number;
  /** 其余上游或覆写透传字段 */
  [key: string]: number | string | ModelCostTier[] | CostFamilyCells | CostSchedule | undefined;
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

/** 思考模式开关：请求体字段等于该值时按思考模式（reasoning 价）计费 */
export interface ThinkingToggle {
  /** 请求体 JSON 路径（gjson 语法），如 "enable_thinking" */
  param: string;
  value: boolean | string | number;
}

/** 供应商级计费规则（native-providers.json） */
export interface ProviderBillingRule {
  /** 聚合价格输出中同名模型冲突时的优先级（数值大者胜出，默认 0） */
  priority?: number;
  /** 思考模式开关；缺省时 reasoning 价无法表达，按 output 价计费并给出警告 */
  thinkingToggle?: ThinkingToggle;
  /** 1 小时 TTL 缓存写入价相对 input 价的倍数（Anthropic 为 2）；缺省不输出 cc1h 项 */
  cacheWrite1h?: number;
}

/** 原生供应商规则 */
export interface NativeProviderRule extends ProviderBillingRule {
  /** 需要排除的非自研模型 ID 模式（不区分大小写的正则表达式） */
  excludeModels?: string[];
  /** NewAPI vendors 图标标识（@lobehub/icons 导出名，如 "Claude.Color"） */
  lobeIcon?: string;
  /** 维护备注（构建时忽略） */
  notes?: string;
}

/** 原生供应商目录配置（data/native-providers.json） */
export interface NativeProvidersConfig {
  version: number;
  /** 非 USD 货币兑美元汇率（每 1 USD 对应的货币数量） */
  exchangeRates?: Record<string, number>;
  providers: Record<string, NativeProviderRule>;
}

/** 覆写配置 */
export interface OverrideConfig {
  providers?: Record<string, Partial<ProviderBase>>;
  models?: Record<string, Partial<Model>>;
  /** 可选的文案本地化覆写 */
  i18n?: {
    providers?: Record<string, I18nOverrideEntity>;
    models?: Record<ModelKey, I18nOverrideEntity>;
  };
}

/** 本地化文本映射 */
export interface I18nTextMap {
  [locale: string]: string | undefined;
}

/** 本地化覆写实体（仅支持 name/description） */
export interface I18nOverrideEntity {
  name?: I18nTextMap;
  description?: I18nTextMap;
}

// === i18n 配置类型 ===

export interface I18nLocaleConfig {
  locale: string;
  name?: string;
  default?: boolean;
  site_name?: string;
  /** 可选：该语言对应展示用的 IANA 时区，例如 "Asia/Shanghai" */
  timeZone?: string;
}

export interface I18nConfig {
  locales: I18nLocaleConfig[];
}

// === API i18n 词典类型 ===

export interface ApiI18nCapabilityLabels {
  tools?: string;
  files?: string;
  reasoning?: string;
  temperature?: string;
}

export interface ApiI18nDefaults {
  model_description?: string; // 模板：例如 "${modelName} is an AI model provided by ${providerId}."
}

export interface ApiI18nMessages {
  capability_labels?: ApiI18nCapabilityLabels;
  defaults?: ApiI18nDefaults;
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

// === NewAPI 相关类型 ===

/** NewAPI 供应商数据 */
export interface NewApiVendor {
  name: string;
  description: string;
  icon: string;
  status: number;
}

/** NewAPI 模型元数据（价格仅由 ratio_config 的表达式提供） */
export interface NewApiModel {
  model_name: string;
  description: string;
  tags: string;
  vendor_name: string;
  endpoints: null;
  status: number;
  name_rule: number;
  icon: string;
}

/** NewAPI 价格配置（/api/ratio_config 载荷；全部模型以表达式计费） */
export interface NewApiPriceConfig {
  data: {
    /** 计费模式（恒为 "tiered_expr"） */
    billing_mode: Record<string, 'tiered_expr'>;
    /** 计费表达式（expr-lang 语法，系数单位 USD/1M tokens；按次为 fixed(USD)） */
    billing_expr: Record<string, string>;
  };
  message: string;
  success: boolean;
}

/** NewAPI 同步载荷 */
export interface NewApiSyncPayload {
  vendors: NewApiVendor[];
  models: NewApiModel[];
}

/** NewAPI 定价选项（货币换算与供应商级计费规则） */
export interface NewApiPricingOptions {
  /** 非 USD 货币兑美元汇率（每 1 USD 对应的货币数量） */
  exchangeRates: Record<string, number>;
  /** 供应商计费规则（优先级、思考开关、1h 缓存写倍数） */
  providers: Record<string, ProviderBillingRule>;
}

// === VoAPI 相关类型 ===
export interface VoAPIFirm {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: number;
  modelCount: number;
  api: string;
  doc: string;
}

export interface VoAPIModel {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  flags: {
    attachment: boolean;
    reasoning: boolean;
    tool_call: boolean;
    temperature: boolean;
    image: boolean;
    audio: boolean;
    open_weights: boolean;
  };
  modalities: {
    input: string[];
    output: string[];
  };
  firm: string;
  maxCtxTokens?: number | null;
  maxOutputTokens?: number | null;
  releaseDate?: string | null;
  lastUpdated?: string | null;
  knowledge?: string | null;
  price?: {
    input?: number | null;
    output?: number | null;
    cacheRead?: number | null;
    cacheWrite?: number | null;
  };
}

export interface VoAPIApiSyncPayload {
  firms: VoAPIFirm[];
  models: VoAPIModel[];
}

// === 构建清单类型 ===

/** 构建统计 */
export interface BuildStats {
  providers: number;
  models: number;
  excludedProviders: number;
  excludedModels: number;
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
  nativeProvidersHash: string;
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
}

/** 模型键 */
export type ModelKey = `${string}/${string}`;
