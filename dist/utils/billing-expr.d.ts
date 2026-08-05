/**
 * new-api 表达式计费（tiered_expr）生成器。
 *
 * 将带分层定价（input_32k_128k 等）或思考模式差价（thinking_*）的
 * USD 成本转换为 new-api 的 billing_expr 表达式（expr-lang 语法）：
 * - 系数单位为 USD / 1M tokens，与 new-api v1 表达式语义一致；
 * - 档位条件使用 len（完整输入上下文长度），阈值采用十进制
 *   （32k = 32000，1m = 1000000），与 new-api 前端预设一致；
 * - 每个档位叶子用 tier("<name>", ...) 包裹以便命中记录；
 * - 思考模式用 param("enable_thinking") 判定（阿里 DashScope /
 *   OpenAI 兼容端点的官方开关参数）。
 */
import type { ModelCost } from '../types/index.js';
/**
 * 从 USD 成本生成 new-api tiered_expr 计费表达式。
 * 仅当模型具有分层定价或思考模式差价时返回表达式，否则返回 null
 * （常规单价模型继续使用 model_ratio 体系）。
 */
export declare function buildTieredBillingExpr(cost: ModelCost | undefined): string | null;
//# sourceMappingURL=billing-expr.d.ts.map