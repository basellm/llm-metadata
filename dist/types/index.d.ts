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
    currency?: 'CNY' | 'USD' | 'EUR';
    input?: number;
    output?: number;
    cache_read?: number;
    cache_write?: number;
    text_input?: number;
    vision_input?: number;
    audio_input?: number;
    multi_output?: number;
    multiin_text_output?: number;
    purein_text_output?: number;
    text?: number;
    vl?: number;
    embedding_text?: number;
    embedding_image?: number;
    per_second?: number;
    per_10k_chars?: number;
    per_image?: number;
    tiers?: ModelCostTier[];
    context_over_200k?: CostFamilyCells;
    [key: string]: number | string | ModelCostTier[] | CostFamilyCells | undefined;
}
/** 各计费家族的价格单元（USD 或 cost.currency 指定货币 / 1M tokens） */
export type CostFamilyCells = Partial<Record<'input' | 'output' | 'cache_read' | 'cache_write', number>>;
/** 结构化上下文阶梯条目（价格在 tier.size tokens 以上生效） */
export interface ModelCostTier extends CostFamilyCells {
    tier?: {
        size?: number;
        type?: string;
    };
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
export interface NativeProviderRule {
    /** 聚合价格输出中同名模型冲突时的优先级（数值大者胜出，默认 0） */
    priority?: number;
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
export interface ApiI18nCapabilityLabels {
    tools?: string;
    files?: string;
    reasoning?: string;
    temperature?: string;
}
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
    vendor_name: string;
    endpoints: null;
    status: number;
    name_rule: number;
    icon: string;
    price_per_m_input?: number | null;
    price_per_m_output?: number | null;
    price_per_m_cache_read?: number | null;
    price_per_m_cache_write?: number | null;
    ratio_model?: number | null;
    ratio_completion?: number | null;
    ratio_cache?: number | null;
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
        /** 单位计费价格（按最小可用单价，单位与提供商标注一致，例如 /img 或 /s 等） */
        model_price: Record<string, number>;
        /** 表达式计费模式（值为 "tiered_expr"，仅分层/思考差价模型输出） */
        billing_mode: Record<string, string>;
        /** 表达式计费表达式（expr-lang 语法，系数单位 USD/1M tokens） */
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
/** NewAPI 定价选项（货币换算与同名模型冲突解析） */
export interface NewApiPricingOptions {
    /** 非 USD 货币兑美元汇率（每 1 USD 对应的货币数量） */
    exchangeRates: Record<string, number>;
    /** 供应商优先级（同名模型时数值大者胜出，缺省为 0） */
    providerPriority: Record<string, number>;
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