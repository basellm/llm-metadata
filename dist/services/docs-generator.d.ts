import type { BuildManifest, NormalizedData, ProviderIndexItem } from '../types/index.js';
/** 文档生成服务 */
export declare class DocumentationGenerator {
    private readonly i18n;
    constructor(rootDir: string);
    /** 生成文档头部 */
    private generateDocumentHeader;
    /** 创建文档上下文 */
    private createDocumentContext;
    /** 将 YYYY 或 YYYY-MM 或 YYYY-MM-DD 字符串解析为时间戳（不可解析返回 null） */
    private parseDateToTimestamp;
    /** 计算 NewAPI 比率（文档用） */
    private calculateNewApiRatios;
    /** 提取单位计费的最小价格（per_image、per_second、per_10k_chars 及其变体） */
    private getMinUnitPrice;
    /** 格式化 NewAPI 比率显示 */
    private formatNewApiRatios;
    /** 构建模型行数据 */
    private buildModelRow;
    /** 生成标准表格 */
    private generateTable;
    /** 生成数据浏览器 Markdown */
    generateDataMarkdown(allModelsData: NormalizedData, providerIndex: ProviderIndexItem[], manifest: BuildManifest, locale?: string): string;
    /** 构建所有模型行数据并按时间排序 */
    private buildAndSortModelRows;
    /** 按时间段分组模型 */
    private groupModelsByTime;
    /** 生成模型卡片组 */
    private renderModelCardSection;
    /** 生成单个模型卡片 */
    private renderModelCard;
    /** 生成较早发布模型的紧凑表格 */
    private renderOlderModelsTable;
    /** 生成"最新发布" Markdown（全站按 release_date 降序） */
    generateReleasesMarkdown(allModelsData: NormalizedData, manifest: BuildManifest, locale?: string): string;
}
//# sourceMappingURL=docs-generator.d.ts.map