import type { NormalizedData, OverrideConfig, PolicyConfig, SourceData } from '../types/index.js';
/** 数据处理服务 */
export declare class DataProcessor {
    /** 创建模型键 */
    private createModelKey;
    /** 生成默认描述 */
    private generateDefaultDescription;
    /** 检查是否允许自动更新 */
    shouldAutoUpdate(policy: PolicyConfig, providerId: string, modelId: string): boolean;
    /** 应用覆写配置 */
    private applyOverrides;
    /** 处理单个模型数据 */
    private processModel;
    /** 处理单个提供商数据 */
    private processProvider;
    /** 将源数据转换为规范化格式 */
    mapSourceToNormalized(source: SourceData): NormalizedData;
    /** 注入手动添加的提供商 */
    injectManualProviders(normalized: NormalizedData, overrides: OverrideConfig): NormalizedData;
    /** 处理所有数据 */
    processAllData(normalized: NormalizedData, overrides: OverrideConfig, sourceProviderIds: Set<string>): NormalizedData;
}
//# sourceMappingURL=data-processor.d.ts.map