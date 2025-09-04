/** 格式化工具函数 */
import { ModelCost } from '../types/index.js';
/** 将 token 数量格式化为 K/M 形式 */
export declare function formatTokensToKM(tokens?: number): string | null;
/** 转义 Markdown 管道符 */
export declare function escapeMarkdownPipes(text?: string): string;
/** 格式化定价信息 */
export declare function formatPricing(cost?: {
    input?: number;
    output?: number;
    cache_read?: number;
    cache_write?: number;
}): string;
/** 格式化能力标志 */
export declare function formatCapabilities(model: {
    attachment?: boolean;
    reasoning?: boolean;
    tool_call?: boolean;
    temperature?: boolean;
    image?: boolean;
}): string;
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
export declare function buildModelPriceInfo(cost?: ModelCost): {
    input: number | null;
    output: number | null;
    cacheRead: number | null;
    cacheWrite: number | null;
};
//# sourceMappingURL=format-utils.d.ts.map