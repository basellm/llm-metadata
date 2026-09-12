import type { NewApiPriceConfig, NewApiPricingOptions, NewApiSyncPayload, NormalizedData } from '../types/index.js';
/** NewAPI 价格配置构建结果 */
export interface NewApiPriceConfigResult {
    config: NewApiPriceConfig;
    warnings: string[];
}
/**
 * NewAPI 构建服务。
 * vendors/models 只承载元数据；价格全部以 ratio_config 中的 tiered_expr 表达式表达。
 */
export declare class NewApiBuilder {
    private readonly pricing;
    constructor(pricing: NewApiPricingOptions);
    /** 供应商优先级（同名模型冲突时数值大者胜出） */
    private priorityOf;
    /** 按优先级降序、ID 升序排列供应商，保证冲突解析的确定性 */
    private sortProviderIds;
    /** 将成本换算为 USD；无法换算时记录聚合警告并返回 undefined */
    private toUsdCost;
    /** 汇总货币换算失败的警告 */
    private collectCurrencyWarnings;
    /**
     * 构建 NewAPI 元数据同步载荷。
     * 同名模型跨供应商时按优先级归属唯一供应商，无模型的供应商不输出。
     */
    buildSyncPayload(allModelsData: NormalizedData, tagMap?: Record<string, string>): NewApiSyncPayload;
    /** 构建 NewAPI 价格配置（可选按提供商过滤）：每个可定价模型一条 tiered_expr 表达式 */
    buildPriceConfig(allModelsData: NormalizedData, providerId?: string): NewApiPriceConfigResult;
}
//# sourceMappingURL=newapi-builder.d.ts.map