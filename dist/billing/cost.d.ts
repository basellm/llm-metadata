import type { CostFamily } from './cost-families.js';
import type { Currency } from './currencies.js';
/** 各计费家族的价格单元（价目货币 / 1M tokens） */
export type CostFamilyCells = Partial<Record<CostFamily, number>>;
/** 结构化上下文阶梯条目（价格在 tier.size tokens 以上生效） */
export interface ModelCostTier extends CostFamilyCells {
    tier?: {
        size?: number;
        type?: string;
    };
}
/**
 * 时段定价窗口（覆写数据）。窗口内给出的价格覆盖基础价，未给出的家族沿用基础价；
 * 基础成本含阶梯时，覆盖价格的窗口必须自带 tiers。
 */
export interface CostScheduleWindow extends CostFamilyCells {
    /** 档位名（写入 tier() 名称，如 "peak"） */
    name: string;
    /** 生效星期（0=周日 … 6=周六）；缺省为每天 */
    weekdays?: number[];
    /** 生效时间区间 "HH:MM-HH:MM"（结束不含；结束早于开始表示跨午夜）；缺省为全天 */
    hours?: string[];
    tiers?: ModelCostTier[];
}
/** 时段定价：按 IANA 时区评估，窗口按顺序匹配，均不命中时采用基础价 */
export interface CostSchedule {
    timezone: string;
    /** 基础价档位名（如 "off_peak"） */
    fallback: string;
    windows: CostScheduleWindow[];
}
/**
 * 单一货币下的价目。
 * tiers 中价格在 tier.size 以上生效；context_over_200k 为同一信息的遗留表示（tiers 存在时忽略）。
 */
export interface CostSheet extends CostFamilyCells {
    tiers?: ModelCostTier[];
    context_over_200k?: CostFamilyCells;
    schedule?: CostSchedule;
    /** 按图计费（价目货币 / 张） */
    per_image?: number;
    /** 其余上游或覆写透传字段 */
    [key: string]: number | string | ModelCostTier[] | CostFamilyCells | CostSchedule | CurrencyOptions | undefined;
}
/** 其他结算货币的官方价目，键为货币代码；结构同主价目（可含 tiers / schedule），不再嵌套 */
export type CurrencyOptions = Partial<Record<Currency, CostSheet>>;
/** 模型成本信息：主价目 + 结算货币 + 同一端点的其他货币价目 */
export interface ModelCost extends CostSheet {
    /** 主价目的结算货币，缺省 USD */
    currency?: Currency;
    /** 同一端点以其他货币公布的官方价目（非汇率换算，如 DeepSeek 同时公布美元与人民币价） */
    currency_options?: CurrencyOptions;
}
/** 思考模式开关：请求体字段等于该值时按思考模式（reasoning 价）计费 */
export interface ThinkingToggle {
    /** 请求体 JSON 路径（gjson 语法），如 "enable_thinking" */
    param: string;
    value: boolean | string | number;
}
/** 影响计费表达式生成的供应商级规则 */
export interface BillingExprOptions {
    /** 思考模式开关；缺省时 reasoning 价无法表达，按 output 价计费并给出警告 */
    thinkingToggle?: ThinkingToggle;
    /** 1 小时 TTL 缓存写入价相对 input 价的倍数（Anthropic 为 2）；缺省不输出 cc1h 项 */
    cacheWrite1h?: number;
}
/**
 * 供应商级计费规则（native-providers.json），随供应商数据以 provider.billing 输出，
 * 使浏览器端能按任意 new-api 部署重新生成表达式与聚合价格配置。
 */
export interface ProviderBillingRule extends BillingExprOptions {
    /** 聚合价格输出中同名模型冲突时的优先级（数值大者胜出，默认 0） */
    priority?: number;
}
//# sourceMappingURL=cost.d.ts.map