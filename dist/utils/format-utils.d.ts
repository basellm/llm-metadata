/** NewAPI / VoAPI 元数据派生工具 */
import type { Model, ModelCost } from '../types/index.js';
/** 归一化显式标签：去空白、去空项 */
export declare function explicitTags(model: Model): string[];
/** 构建 NewAPI 模型标签：显式标签 + 能力 + 模态 + 生命周期状态 + 上下文窗口（经 map 本地化） */
export declare function buildModelTags(model: Model, map?: Record<string, string>): string[];
/** 构建 VoAPI 模型价格信息 */
export declare function buildModelPriceInfo(cost?: ModelCost): {
    input: number | null;
    output: number | null;
    cacheRead: number | null;
    cacheWrite: number | null;
};
//# sourceMappingURL=format-utils.d.ts.map