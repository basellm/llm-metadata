import type { NormalizedData, OverrideConfig, PolicyConfig, SourceData } from '../types/index.js';
import type { I18nService } from './i18n-service.js';
/** 本地化结果：数据集 + 仍回退为英文的模型描述原文（每个模型一项，可重复） */
export interface LocalizedDataset {
    data: NormalizedData;
    untranslated: string[];
}
/** 数据处理服务 */
export declare class DataProcessor {
    private readonly i18n;
    constructor(i18n: I18nService);
    /** 创建模型键 */
    private createModelKey;
    /** 按 locale 生成默认描述（fallback 到英文模板） */
    private generateDefaultDescription;
    /** 检查是否允许自动更新 */
    shouldAutoUpdate(policy: PolicyConfig, providerId: string, modelId: string): boolean;
    /**
     * 应用模型级覆写。默认深合并；但覆写的 cost 声明了结算货币时整体替换成本对象：
     * 货币切换意味着每个价格都换了单位，深合并会让上游其他货币的数值（如未固定的 cache_read）残留。
     */
    private applyModelOverride;
    /** 应用 i18n 覆写的英文文案（其它语言在本地化阶段切换） */
    private applyEnglishI18n;
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
    /**
     * 根据 locale 应用 i18n 文案到标准化数据（返回新对象）。
     * 模型描述的解析顺序：人工覆写（data/overrides/i18n）→ 翻译记忆（i18n/descriptions）
     * → 默认描述模板 → 保留英文（计入 untranslated）。
     */
    localizeNormalizedData(data: NormalizedData, overrides: OverrideConfig, locale: string): LocalizedDataset;
}
//# sourceMappingURL=data-processor.d.ts.map