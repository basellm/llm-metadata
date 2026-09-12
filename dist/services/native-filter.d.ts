import type { NativeProvidersConfig, NormalizedData, ProviderBillingRule } from '../types/index.js';
/** 过滤结果 */
export interface NativeFilterResult {
    data: NormalizedData;
    excludedProviders: number;
    excludedModels: number;
    warnings: string[];
}
/**
 * 原生供应商过滤服务。
 *
 * 上游 models.dev 混杂了大量聚合商/转售商，本服务依据
 * data/native-providers.json 白名单只保留第一方（原生）供应商，
 * 并可按规则剔除原生供应商中托管的第三方模型。
 */
export declare class NativeFilter {
    private readonly config;
    private readonly excludePatterns;
    private readonly providerRules;
    private readonly configWarnings;
    constructor(config: NativeProvidersConfig | null);
    /** 校验供应商级计费规则，非法字段丢弃并警告 */
    private sanitizeBillingRule;
    /** 是否启用过滤（配置缺失时构建保持全量并给出警告） */
    get enabled(): boolean;
    /** 非 USD 货币兑美元汇率（每 1 USD 对应的货币数量） */
    getExchangeRates(): Record<string, number>;
    /** 已校验的供应商级计费规则（优先级、思考开关、1h 缓存写倍数） */
    getProviderRules(): Record<string, ProviderBillingRule>;
    /** 应用白名单与模型排除规则 */
    apply(normalized: NormalizedData): NativeFilterResult;
}
//# sourceMappingURL=native-filter.d.ts.map