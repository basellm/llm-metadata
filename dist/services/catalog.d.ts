import type { NativeProvidersConfig, NormalizedData, OverrideConfig, PolicyConfig, SourceData } from '../types/index.js';
import { DataLoader } from './data-loader.js';
import { DataProcessor } from './data-processor.js';
import { I18nService } from './i18n-service.js';
import { NativeFilter } from './native-filter.js';
/** 目录结构（均为绝对路径） */
export interface CatalogPaths {
    root: string;
    dataDir: string;
    cacheDir: string;
}
/** 加载并处理完成、可直接产出的目录数据 */
export interface Catalog {
    source: SourceData;
    overrides: OverrideConfig;
    policy: PolicyConfig;
    nativeConfig: NativeProvidersConfig | null;
    nativeFilter: NativeFilter;
    /** 经覆写、注入与原生过滤后的最终数据集 */
    data: NormalizedData;
    excludedProviders: number;
    excludedModels: number;
    warnings: string[];
    loader: DataLoader;
    processor: DataProcessor;
    i18n: I18nService;
}
export declare function catalogPaths(root: string): CatalogPaths;
/**
 * 构建与翻译脚本共用的加载管线：
 * 上游数据（网络失败回退缓存）→ 覆写/策略/原生目录 → 处理 → 原生过滤。
 */
export declare function loadCatalog(paths: CatalogPaths): Promise<Catalog>;
//# sourceMappingURL=catalog.d.ts.map