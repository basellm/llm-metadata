import type { NewApiPriceConfig, NewApiSyncPayload, NormalizedData } from '../types/index.js';
/** NewAPI 构建服务 */
export declare class NewApiBuilder {
    /** 计算 NewAPI 价格比率（使用分层定价中的最高价格） */
    private calculateRatios;
    /** 计算每百万 tokens 的美元价格与倍率字段 */
    private buildPricingFields;
    /** 构建 NewAPI 同步载荷 */
    buildSyncPayload(allModelsData: NormalizedData, tagMap?: Record<string, string>): NewApiSyncPayload;
    /** 构建 NewAPI 价格配置（可选按提供商过滤） */
    buildPriceConfig(allModelsData: NormalizedData, providerId?: string): NewApiPriceConfig;
}
//# sourceMappingURL=newapi-builder.d.ts.map