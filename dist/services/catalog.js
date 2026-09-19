import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDirSync } from '../utils/file-utils.js';
import { stableStringify } from '../utils/object-utils.js';
import { DataLoader } from './data-loader.js';
import { DataProcessor } from './data-processor.js';
import { I18nService } from './i18n-service.js';
import { NativeFilter } from './native-filter.js';
const SOURCE_URL = 'https://models.dev/api.json';
export function catalogPaths(root) {
    return { root, dataDir: join(root, 'data'), cacheDir: join(root, '.cache') };
}
/**
 * 构建与翻译脚本共用的加载管线：
 * 上游数据（网络失败回退缓存）→ 覆写/策略/原生目录 → 处理 → 原生过滤。
 */
export async function loadCatalog(paths) {
    ensureDirSync(paths.cacheDir);
    ensureDirSync(paths.dataDir);
    const loader = new DataLoader(paths.dataDir, paths.cacheDir);
    const i18n = new I18nService(paths.root);
    const processor = new DataProcessor(i18n);
    console.log('Loading source data...');
    const source = await loader.loadSourceData(SOURCE_URL);
    writeFileSync(join(paths.cacheDir, 'api.json'), stableStringify(source), 'utf8');
    console.log('Loading configuration...');
    const overrides = loader.loadOverrides();
    const policy = loader.loadPolicy();
    const nativeConfig = loader.loadNativeProviders();
    const nativeFilter = new NativeFilter(nativeConfig);
    console.log('Processing data...');
    const sourceProviderIds = new Set(Object.keys(source));
    const normalized = processor.injectManualProviders(processor.mapSourceToNormalized(source), overrides);
    const processed = processor.processAllData(normalized, overrides, sourceProviderIds);
    console.log('Filtering to native providers...');
    const filtered = nativeFilter.apply(processed);
    console.log(`Native filter: kept ${Object.keys(filtered.data.providers).length} provider(s), ` +
        `excluded ${filtered.excludedProviders} provider(s) and ${filtered.excludedModels} hosted model(s)`);
    return {
        source,
        overrides,
        policy,
        nativeConfig,
        nativeFilter,
        data: filtered.data,
        excludedProviders: filtered.excludedProviders,
        excludedModels: filtered.excludedModels,
        warnings: filtered.warnings,
        loader,
        processor,
        i18n,
    };
}
//# sourceMappingURL=catalog.js.map