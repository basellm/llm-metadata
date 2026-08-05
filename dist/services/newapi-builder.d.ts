import type { NewApiPriceConfig, NewApiPricingOptions, NewApiSyncPayload, NormalizedData } from '../types/index.js';
/** NewAPI 同步载荷构建结果 */
export interface NewApiSyncResult extends NewApiSyncPayload {
    warnings: string[];
}
/** NewAPI 价格配置构建结果 */
export interface NewApiPriceConfigResult {
    config: NewApiPriceConfig;
    warnings: string[];
}
/** NewAPI 构建服务 */
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
    /** 计算 NewAPI 价格比率（使用分层定价中的最高价格，成本须为 USD） */
    private calculateRatios;
    /** 提取单位计费的最小价格（per_image、per_second、per_10k_chars 及其变体） */
    private getMinUnitPrice;
    /** 计算每百万 tokens 的美元价格与倍率字段（成本须为 USD） */
    private buildPricingFields;
    /**
     * 构建 NewAPI 同步载荷。
     * 同名模型跨供应商时按优先级归属唯一供应商，无模型的供应商不输出。
     */
    buildSyncPayload(allModelsData: NormalizedData, tagMap?: Record<string, string>): NewApiSyncResult;
    /** 构建 NewAPI 价格配置（可选按提供商过滤） */
    buildPriceConfig(allModelsData: NormalizedData, providerId?: string): NewApiPriceConfigResult;
}
//# sourceMappingURL=newapi-builder.d.ts.map