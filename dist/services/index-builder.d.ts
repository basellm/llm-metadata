import type { IndexOutput, NormalizedData, OverrideConfig, ProvidersOutput } from '../types/index.js';
/** 索引构建服务 */
export declare class IndexBuilder {
    /** 构建提供商和模型索引 */
    buildIndexes(normalized: NormalizedData, overrides: OverrideConfig): IndexOutput;
    /** 构建提供商索引输出 */
    buildProvidersOutput(indexes: IndexOutput): ProvidersOutput;
}
//# sourceMappingURL=index-builder.d.ts.map