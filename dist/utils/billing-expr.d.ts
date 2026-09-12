/**
 * new-api 表达式计费（tiered_expr）生成器。
 *
 * 将 models.dev 形态的 USD 成本（基础价、reasoning 思考价、tiers 上下文阶梯、
 * 音频价）与仓库扩展（schedule 时段定价、per_image 按图价）转换为 new-api 的
 * billing_expr（expr-lang 语法）：
 * - 系数为 USD / 1M tokens 实价，与 new-api v1 表达式语义一致；
 * - 每个价格叶子以 tier("<name>", …) 包裹，供 new-api 记录命中档位；
 * - 显式 0 价保留为 `cr * 0` 等项：new-api 仅在表达式引用变量时才把对应 token
 *   从 p/c 中剔除，省略与 0 价并不等价；
 * - 分支自外向内：时段窗口（weekday/hour/minute 探针）→ 思考模式（param 探针）
 *   → 上下文阶梯（len，十进制阈值）；
 * - 时段条件采用 new-api 前端可结构化展示的形状：
 *   weekday(tz) >= a && weekday(tz) <= b && ((hour(tz) >= s && hour(tz) < e) || …)。
 */
import type { ModelCost, ProviderBillingRule } from '../types/index.js';
/** 生成选项：供应商级计费规则中影响表达式的部分 */
export type BillingExprOptions = Pick<ProviderBillingRule, 'thinkingToggle' | 'cacheWrite1h'>;
/** 生成结果：expr 为 null 表示该模型无法以表达式计费（原因见 warnings） */
export interface BillingExprResult {
    expr: string | null;
    warnings: string[];
}
/**
 * 从 USD 成本生成 new-api 计费表达式。
 * 无 token 输入价时回退按图价（tier("image", fixed(USD)) * image_count）；
 * 均缺失或时段配置不合法时返回 null 并给出原因。
 */
export declare function buildBillingExpr(cost: ModelCost, options: BillingExprOptions): BillingExprResult;
//# sourceMappingURL=billing-expr.d.ts.map