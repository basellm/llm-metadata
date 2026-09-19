/**
 * new-api 表达式计费（tiered_expr）生成器。
 *
 * 将 models.dev 形态的价目（基础价、reasoning 思考价、tiers 上下文阶梯、音频价）
 * 与仓库扩展（schedule 时段定价、per_image 按图价）转换为 new-api 的
 * billing_expr（expr-lang 语法）：
 * - 输入价目须已换算到计费平面（quota-USD，见 plane.ts）；系数即平面单位 / 1M tokens，
 *   与 new-api v1 表达式语义（quota = 结果 / 1e6 × QuotaPerUnit）一致；
 * - 每个价格叶子以 tier("<name>", …) 包裹，供 new-api 记录命中档位；
 * - 显式 0 价保留为 `cr * 0` 等项：new-api 仅在表达式引用变量时才把对应 token
 *   从 p/c 中剔除，省略与 0 价并不等价；
 * - 分支自外向内：时段窗口（weekday/hour/minute 探针）→ 思考模式（param 探针）
 *   → 上下文阶梯（len，十进制阈值）；
 * - 时段条件采用 new-api 前端可结构化展示的形状：
 *   weekday(tz) >= a && weekday(tz) <= b && ((hour(tz) >= s && hour(tz) < e) || …)。
 */
import type { BillingExprOptions, ModelCost } from './cost.js';
import { type PlaneRates } from './plane.js';
/** 生成结果：expr 为 null 表示该模型无法以表达式计费（原因见 warnings） */
export interface BillingExprResult {
    expr: string | null;
    warnings: string[];
}
/** 含货币换算的生成结果 */
export interface ModelBillingExprResult extends BillingExprResult {
    /** 价目货币缺少汇率：未生成表达式，warnings 亦为空（由调用方汇总） */
    unknownCurrency?: string;
}
/**
 * 从已换算到计费平面的价目生成 new-api 计费表达式。
 * 无 token 输入价时回退按图价（tier("image", fixed(每张价)) * image_count）；
 * 均缺失或时段配置不合法时返回 null 并给出原因。
 */
export declare function buildBillingExpr(cost: ModelCost, options: BillingExprOptions): BillingExprResult;
/**
 * 从任意货币的价目生成表达式：先按 rates 换算到计费平面，再生成。
 * 价目缺失时 expr 为 null 且无警告；货币无汇率时返回 unknownCurrency。
 */
export declare function buildModelBillingExpr(cost: ModelCost | undefined, options: BillingExprOptions, rates: PlaneRates): ModelBillingExprResult;
//# sourceMappingURL=expr.d.ts.map