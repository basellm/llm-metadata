import type { ModelCost, ProviderBillingRule } from './cost.js';
import { type NewApiDeployment } from './deployment.js';
export interface NewApiPriceConfig {
    data: {
        /** 计费模式（恒为 "tiered_expr"） */
        billing_mode: Record<string, 'tiered_expr'>;
        /** 计费表达式（expr-lang 语法，系数单位 quota-USD / 1M tokens；按次为 fixed(quota-USD)） */
        billing_expr: Record<string, string>;
    };
    message: string;
    success: boolean;
}
/** 生成价格配置所需的最小供应商形状 */
export interface RatioConfigProvider {
    id: string;
    models: Record<string, {
        cost?: ModelCost;
    }>;
    billing?: ProviderBillingRule;
}
export interface RatioConfigResult {
    config: NewApiPriceConfig;
    warnings: string[];
}
/** 按优先级降序、ID 升序排列供应商，保证同名模型冲突解析的确定性 */
export declare function sortByPriority<T extends RatioConfigProvider>(providers: readonly T[]): T[];
/**
 * 为一组供应商生成 ratio_config：每个可定价模型一条 tiered_expr 表达式；
 * 同名模型跨供应商时归属优先级最高者；价目货币缺少汇率的模型跳过并汇总警告。
 */
export declare function buildRatioConfig(providers: readonly RatioConfigProvider[], deployment: NewApiDeployment, fallbackFx?: Readonly<Record<string, number>>): RatioConfigResult;
//# sourceMappingURL=ratio-config.d.ts.map