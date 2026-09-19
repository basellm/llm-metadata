import type { NativeProvidersConfig, NormalizedData } from '../types/index.js';
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
 * 并可按规则剔除原生供应商中托管的第三方模型；同时把目录中的
 * 供应商属性（lobeIcon、结算货币、订阅标记、计费规则）注入数据并校验价目货币的一致性。
 */
export declare class NativeFilter {
    private readonly config;
    private readonly excludePatterns;
    private readonly providerRules;
    private readonly providerCurrencies;
    private readonly configWarnings;
    constructor(config: NativeProvidersConfig | null);
    /** 校验供应商级计费规则，非法字段丢弃并警告 */
    private sanitizeBillingRule;
    /** 非 USD 货币兑美元汇率（每 1 USD 对应的货币数量） */
    getExchangeRates(): Record<string, number>;
    /** 价目是否含正的计费家族价格（全 0 的免费 / 订阅模型与货币无关） */
    private static hasPositivePrice;
    /**
     * 校验单个模型的价目货币并返回清洗后的模型：
     * - currency_options 只接受已知且不同于主货币的键，其余丢弃并警告；
     * - 主货币与端点货币不一致时警告（覆写填错端点的常见错误）。
     * 返回该模型是否为“非 USD 端点上仍沿用上游 USD 数值”的估算价。
     */
    private auditModelCurrency;
    /** 应用白名单、模型排除规则与货币审计 */
    apply(normalized: NormalizedData): NativeFilterResult;
}
//# sourceMappingURL=native-filter.d.ts.map