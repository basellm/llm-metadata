/** 格式化工具函数 */
import type { ModelCost } from '../types/index.js';
/** 将 token 数量格式化为 K/M 形式 */
export declare function formatTokensToKM(tokens?: number): string | null;
/** 转义 Markdown 管道符 */
export declare function escapeMarkdownPipes(text?: string): string;
/** 格式化定价信息 */
export declare function formatPricing(cost?: ModelCost): string;
/** 能力模型类型 */
type CapabilityModel = {
    attachment?: boolean;
    reasoning?: boolean;
    tool_call?: boolean;
    temperature?: boolean;
    image?: boolean;
};
/** 格式化能力标志 */
export declare function formatCapabilities(model: CapabilityModel): string;
/** 格式化模态信息 */
export declare function formatModalities(modalities?: {
    input?: string[];
    output?: string[];
}): string;
/** 格式化额外详情 */
export declare function formatDetails(model: {
    open_weights?: boolean;
    release_date?: string;
    last_updated?: string;
}): string;
/** 格式化限制信息 */
export declare function formatLimit(value?: number): string;
/** 构建模型标签字符串 */
export declare function buildModelTags(model: any, map?: Record<string, string>): string[];
/** 货币换算结果 */
export interface UsdCostResult {
    /** 换算为 USD 后的成本（原始即 USD 时原样返回；无法换算时为 undefined） */
    cost?: ModelCost;
    /** 无法换算的货币代码（缺少汇率时返回） */
    unknownCurrency?: string;
}
/**
 * 将成本对象规范化为 USD（new-api 表达式系数以 USD 为基准）。
 * 顶层数字字段与嵌套结构（tiers / context_over_200k / schedule 窗口及其 tiers）
 * 中的计费家族价格一并换算；tier.size、weekdays 等非价格字段保持原样。
 */
export declare function normalizeCostToUSD(cost: ModelCost | undefined, exchangeRates: Record<string, number>): UsdCostResult;
/** 构建模型价格信息 */
export declare function buildModelPriceInfo(cost?: ModelCost): {
    input: number | null;
    output: number | null;
    cacheRead: number | null;
    cacheWrite: number | null;
};
export {};
//# sourceMappingURL=format-utils.d.ts.map