import type { NewApiPriceConfig, NewApiSyncPayload, NormalizedData } from '../types/index.js';
/** NewAPI 构建服务 */
export declare class NewApiBuilder {
    /** 计算 NewAPI 价格比率 */
    private calculateRatios;
    /** 构建模型标签字符串 */
    private buildModelTags;
    /** 构建 NewAPI 同步载荷 */
    buildSyncPayload(allModelsData: NormalizedData, tagMap?: Record<string, string>): NewApiSyncPayload;
    /** 构建 NewAPI 价格配置 */
    buildPriceConfig(allModelsData: NormalizedData): NewApiPriceConfig;
}
//# sourceMappingURL=newapi-builder.d.ts.map