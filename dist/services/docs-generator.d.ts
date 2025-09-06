import type { BuildManifest, NormalizedData, ProviderIndexItem } from '../types/index.js';
/** 文档生成服务 */
export declare class DocumentationGenerator {
    private readonly i18n;
    constructor(rootDir: string);
    /** 将 YYYY 或 YYYY-MM 或 YYYY-MM-DD 字符串解析为时间戳（不可解析返回 null） */
    private parseDateToTimestamp;
    /** 计算 NewAPI 比率（文档用） */
    private calculateNewApiRatios;
    /** 格式化 NewAPI 比率显示 */
    private formatNewApiRatios;
    /** 生成数据浏览器 Markdown */
    generateDataMarkdown(allModelsData: NormalizedData, providerIndex: ProviderIndexItem[], manifest: BuildManifest, locale?: string): string;
    /** 生成"最新发布" Markdown（全站按 release_date 降序） */
    generateReleasesMarkdown(allModelsData: NormalizedData, manifest: BuildManifest, locale?: string): string;
}
//# sourceMappingURL=docs-generator.d.ts.map