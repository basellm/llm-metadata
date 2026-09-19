import type { ModelCost, ProviderBillingRule } from '../billing/cost.js';
import type { Currency } from '../billing/currencies.js';
export type { CurrencyOptions, ModelCost, ProviderBillingRule } from '../billing/cost.js';
/** 基础模型信息 */
export interface ModelBase {
    id: string;
    name?: string;
    description?: string;
    tags?: string[];
    icon?: string;
    /** 模型系列（models.dev family，如 "qwen"、"claude-opus"） */
    family?: string;
    /** 生命周期状态（models.dev status，如 "deprecated"、"beta"）；缺省为正常可用 */
    status?: string;
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
    structured_output?: boolean;
    temperature?: boolean;
}
/** 模型输入输出限制 */
export interface ModelLimits {
    context?: number;
    output?: number;
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
/** 基础提供商信息（lobeIcon / currency / subscription / billing 由 native-providers.json 注入） */
export interface ProviderBase {
    id: string;
    name?: string;
    description?: string;
    api?: string;
    doc?: string;
    icon?: string;
    iconURL?: string;
    lobeIcon?: string;
    /** 端点结算货币，缺省 USD */
    currency?: Currency;
    /** 订阅套餐端点（Token Plan / Coding Plan）：用量从预付额度抵扣，上游 0 价不具信息量；仅为 true 时输出 */
    subscription?: boolean;
    /** new-api 计费规则（优先级、思考开关、1h 缓存写倍数）；无规则时省略 */
    billing?: ProviderBillingRule;
}
/** 完整提供商数据 */
export interface Provider extends ProviderBase {
    models: Record<string, Model>;
}
/** models.dev API 响应格式 */
export type SourceData = Record<string, Provider>;
/** 策略配置 */
export interface PolicyConfig {
    providers?: Record<string, {
        auto?: boolean;
    }>;
    models?: Record<string, {
        auto?: boolean;
    }>;
}
/** 原生供应商规则 */
export interface NativeProviderRule extends ProviderBillingRule {
    /** 需要排除的非自研模型 ID 模式（不区分大小写的正则表达式） */
    excludeModels?: string[];
    /** NewAPI vendors 图标标识（@lobehub/icons 导出名，如 "Claude.Color"） */
    lobeIcon?: string;
    /**
     * 端点结算货币（缺省 USD）。非 USD 端点上未通过覆写给出该货币价目的模型，
     * 其上游 USD 数值只是估算，构建会汇总警告以推动补齐。
     */
    currency?: Currency;
    /** 订阅套餐端点（Token Plan / Coding Plan）：随供应商输出，Web UI 不列出 */
    subscription?: boolean;
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
/** 标签键（能力 / 模态 / 状态 / 显式 tags）→ 本地化标签 */
export type ApiI18nCapabilityLabels = Record<string, string>;
export interface ApiI18nDefaults {
    model_description?: string;
}
export interface ApiI18nMessages {
    capability_labels?: ApiI18nCapabilityLabels;
    defaults?: ApiI18nDefaults;
}
/** 提供商索引项 */
export interface ProviderIndexItem {
    id: string;
    name: string;
    api?: string | undefined;
    doc?: string | undefined;
    iconURL?: string | undefined;
    lobeIcon?: string | undefined;
    currency?: Currency | undefined;
    subscription?: boolean | undefined;
    billing?: ProviderBillingRule | undefined;
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
/** NewAPI 同步载荷 */
export interface NewApiSyncPayload {
    vendors: NewApiVendor[];
    models: NewApiModel[];
}
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
    /** 静态 NewAPI 预设的生成假设：非美元价目换算到 quota-USD 所用的汇率（每 1 USD 的货币数量） */
    newapi: {
        exchangeRates: Record<string, number>;
    };
    warnings?: string[] | undefined;
}
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
//# sourceMappingURL=index.d.ts.map