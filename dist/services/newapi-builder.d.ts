import type { NewApiDeployment } from '../billing/deployment.js';
import { type RatioConfigResult } from '../billing/ratio-config.js';
import type { NewApiSyncPayload, NormalizedData } from '../types/index.js';
/**
 * NewAPI 构建服务。
 * vendors/models 只承载元数据；价格全部以 ratio_config 中的 tiered_expr 表达式表达，
 * 表达式生成委托给与 Web UI 共用的 src/billing 核心（静态预设按默认部署生成）。
 */
export declare class NewApiBuilder {
    private readonly deployment;
    private readonly exchangeRates;
    constructor(deployment: NewApiDeployment, exchangeRates: Readonly<Record<string, number>>);
    private static asRatioConfigProvider;
    /**
     * 构建 NewAPI 元数据同步载荷。
     * 同名模型跨供应商时按优先级归属唯一供应商，无模型的供应商不输出。
     */
    buildSyncPayload(allModelsData: NormalizedData, tagMap?: Record<string, string>): NewApiSyncPayload;
    /** 构建 NewAPI 价格配置（可选按提供商过滤）：每个可定价模型一条 tiered_expr 表达式 */
    buildPriceConfig(allModelsData: NormalizedData, providerId?: string): RatioConfigResult;
}
//# sourceMappingURL=newapi-builder.d.ts.map