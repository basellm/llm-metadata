import type { BuildManifest, NormalizedData, ProviderIndexItem } from '../types/index.js';
/** 文档生成服务 */
export declare class DocumentationGenerator {
    private readonly i18n;
    constructor(rootDir: string);
    /** 计算 NewAPI 比率（文档用） */
    private calculateNewApiRatios;
    /** 格式化 NewAPI 比率显示 */
    private formatNewApiRatios;
    /** 生成数据浏览器 Markdown */
    generateDataMarkdown(allModelsData: NormalizedData, providerIndex: ProviderIndexItem[], manifest: BuildManifest, locale?: string): string;
}
//# sourceMappingURL=docs-generator.d.ts.map