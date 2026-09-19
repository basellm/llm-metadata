import type { ModelCost } from './cost.js';
/** 货币代码 → 每 1 平面单位（quota-USD）对应的该货币数量 */
export type PlaneRates = Readonly<Record<string, number>>;
/** 换算结果 */
export interface PlaneCostResult {
    /** 换算后的价目（原始即平面单位时原样返回；无法换算时为 undefined） */
    cost?: ModelCost;
    /** 无法换算的货币代码（缺少汇率时返回） */
    unknownCurrency?: string;
}
/**
 * 将价目换算到计费平面：顶层数字字段与嵌套结构（tiers / context_over_200k /
 * schedule 窗口及其 tiers）中的计费家族价格一并换算（保留 6 位有效数字）；
 * tier.size、weekdays 等非价格字段保持原样。其他货币的官方价目（currency_options）
 * 不参与换算，结果中丢弃。汇率为 1 时原样返回（不做任何舍入）。
 * rates 缺少 USD 时视为 1（真实美元即平面单位）。
 */
export declare function normalizeCostToPlane(cost: ModelCost | undefined, rates: PlaneRates): PlaneCostResult;
//# sourceMappingURL=plane.d.ts.map