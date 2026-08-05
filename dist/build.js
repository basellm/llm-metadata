#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DataLoader } from './services/data-loader.js';
import { DataProcessor } from './services/data-processor.js';
import { IndexBuilder } from './services/index-builder.js';
import { mirrorProviderLogos } from './services/logo-mirror.js';
import { NativeFilter } from './services/native-filter.js';
import { NewApiBuilder } from './services/newapi-builder.js';
import { I18nService } from './services/i18n-service.js';
import { parseArgv } from './utils/cli-utils.js';
import { copyDirSyncIfExists, ensureDirSync, pruneFiles, pruneSubdirectories, removeNonJsonFiles, sanitizeFileSegment, writeJSONIfChanged, } from './utils/file-utils.js';
import { sha256OfObject, stableStringify } from './utils/object-utils.js';
import { VoAPIBuilder } from './services/voapi-builder.js';
/** 主构建类 */
class Builder {
    ROOT;
    DIST_DIR;
    API_DIR;
    CACHE_DIR;
    DATA_DIR;
    SOURCE_URL = 'https://models.dev/api.json';
    dataLoader;
    dataProcessor;
    indexBuilder;
    voApiBuilder;
    i18nService;
    constructor() {
        this.ROOT = resolve(process.cwd());
        this.DIST_DIR = join(this.ROOT, 'dist');
        this.API_DIR = join(this.DIST_DIR, 'api');
        this.CACHE_DIR = join(this.ROOT, '.cache');
        this.DATA_DIR = join(this.ROOT, 'data');
        this.dataLoader = new DataLoader(this.DATA_DIR, this.CACHE_DIR);
        this.dataProcessor = new DataProcessor();
        this.indexBuilder = new IndexBuilder();
        this.voApiBuilder = new VoAPIBuilder();
        this.i18nService = new I18nService(this.ROOT);
    }
    /** 写入提供商和模型文件并清理陈旧产物（返回变更数） */
    writeProvidersAndModels(baseDir, dataset, policy, sourceProviderIds, options) {
        let changes = 0;
        const providersDir = join(baseDir, 'providers');
        const modelsBaseDir = join(baseDir, 'models');
        const keepProviders = new Set(Object.keys(dataset.providers).map(sanitizeFileSegment));
        // 清理已不在数据集中的供应商产物
        changes += pruneFiles(providersDir, keepProviders, '.json', options);
        changes += pruneSubdirectories(modelsBaseDir, keepProviders, options);
        for (const [providerId, provider] of Object.entries(dataset.providers)) {
            const safeProvider = sanitizeFileSegment(providerId);
            // 提供商文件
            let providerOut = { ...provider };
            if (sourceProviderIds.has(providerId)) {
                providerOut = {
                    ...providerOut,
                    iconURL: `https://models.dev/logos/${providerId}.svg`,
                };
            }
            const providerPath = join(providersDir, `${safeProvider}.json`);
            if (writeJSONIfChanged(providerPath, providerOut, options)) {
                changes++;
            }
            // 模型文件
            const providerModelsDir = join(modelsBaseDir, safeProvider);
            ensureDirSync(providerModelsDir);
            removeNonJsonFiles(providerModelsDir, options);
            const models = provider.models || {};
            const keepModels = new Set(Object.keys(models).map(sanitizeFileSegment));
            changes += pruneFiles(providerModelsDir, keepModels, '.json', options);
            for (const [modelId, modelData] of Object.entries(models)) {
                const allowAuto = this.dataProcessor.shouldAutoUpdate(policy, providerId, modelId);
                const modelPath = join(providerModelsDir, `${sanitizeFileSegment(modelId)}.json`);
                const existing = this.dataLoader.readJSONSafe(modelPath, null);
                if (!options.force && !allowAuto && existing) {
                    continue; // 跳过非自动模式的现有文件
                }
                if (writeJSONIfChanged(modelPath, modelData, options)) {
                    changes++;
                }
            }
        }
        return changes;
    }
    /** 计算构建清单 */
    computeManifest(params) {
        const result = {
            version: 1,
            generatedAt: new Date().toISOString(),
            sourceHash: params.sourceHash,
            overridesHash: params.overridesHash,
            policyHash: params.policyHash,
            nativeProvidersHash: params.nativeProvidersHash,
            stats: params.stats,
        };
        if (params.warnings) {
            result.warnings = params.warnings;
        }
        return result;
    }
    /** 主构建流程 */
    async build(config) {
        const { dryRun, force } = config;
        // 准备目录
        ensureDirSync(this.CACHE_DIR);
        ensureDirSync(this.DATA_DIR);
        ensureDirSync(this.DIST_DIR);
        ensureDirSync(this.API_DIR);
        copyDirSyncIfExists(join(this.ROOT, 'public'), this.DIST_DIR);
        // 加载数据
        console.log('Loading source data...');
        const source = await this.dataLoader.loadSourceData(this.SOURCE_URL);
        // 缓存源数据
        writeFileSync(join(this.CACHE_DIR, 'api.json'), stableStringify(source), 'utf8');
        // 加载配置
        console.log('Loading configuration...');
        const overrides = this.dataLoader.loadOverrides();
        const policy = this.dataLoader.loadPolicy();
        const nativeConfig = this.dataLoader.loadNativeProviders();
        const nativeFilter = new NativeFilter(nativeConfig);
        const warnings = [];
        // 处理数据
        console.log('Processing data...');
        let normalized = this.dataProcessor.mapSourceToNormalized(source);
        const sourceProviderIds = new Set(Object.keys(source));
        // 注入手动提供商
        normalized = this.dataProcessor.injectManualProviders(normalized, overrides);
        // 处理所有数据（含 overrides 注入的模型）
        const processed = this.dataProcessor.processAllData(normalized, overrides, sourceProviderIds);
        // 仅保留原生供应商及其自研模型（作为输出前的最后一道过滤）
        console.log('Filtering to native providers...');
        const filtered = nativeFilter.apply(processed);
        warnings.push(...filtered.warnings);
        console.log(`Native filter: kept ${Object.keys(filtered.data.providers).length} provider(s), ` +
            `excluded ${filtered.excludedProviders} provider(s) and ${filtered.excludedModels} hosted model(s)`);
        const allModelsData = filtered.data;
        // NewAPI 构建器（货币换算 + 同名模型优先级解析）
        const newApiBuilder = new NewApiBuilder({
            exchangeRates: nativeFilter.getExchangeRates(),
            providerPriority: nativeFilter.getPriorities(),
        });
        const newApiWarnings = new Set();
        // 构建索引
        console.log('Building indexes...');
        const indexes = this.indexBuilder.buildIndexes(allModelsData, overrides);
        const providersOutput = this.indexBuilder.buildProvidersOutput(indexes);
        // 计算哈希
        const sourceHash = sha256OfObject(source);
        const overridesHash = sha256OfObject(overrides);
        const policyHash = sha256OfObject(policy);
        const nativeProvidersHash = sha256OfObject(nativeConfig ?? {});
        let changes = 0;
        // 写入主索引
        console.log('Writing main indexes...');
        if (writeJSONIfChanged(join(this.API_DIR, 'index.json'), indexes, { dryRun })) {
            changes++;
        }
        if (writeJSONIfChanged(join(this.API_DIR, 'providers.json'), providersOutput, { dryRun })) {
            changes++;
        }
        // 写入完整数据
        console.log('Writing complete models data...');
        if (writeJSONIfChanged(join(this.API_DIR, 'all.json'), allModelsData.providers, { dryRun })) {
            changes++;
        }
        // 写入 i18n 版本的完整数据与索引（按配置 locales 循环）
        {
            const i18nDir = join(this.API_DIR, 'i18n');
            ensureDirSync(i18nDir);
            const locales = this.i18nService.getLocales().map((l) => l.locale);
            for (const locale of locales) {
                const allLocalized = this.dataProcessor.localizeNormalizedData(allModelsData, overrides, locale);
                const outDir = join(i18nDir, locale);
                ensureDirSync(outDir);
                if (writeJSONIfChanged(join(outDir, 'all.json'), allLocalized.providers, { dryRun })) {
                    changes++;
                }
                const indexesLoc = this.indexBuilder.buildIndexes(allLocalized, overrides);
                const providersOutLoc = this.indexBuilder.buildProvidersOutput(indexesLoc);
                if (writeJSONIfChanged(join(outDir, 'index.json'), indexesLoc, { dryRun })) {
                    changes++;
                }
                if (writeJSONIfChanged(join(outDir, 'providers.json'), providersOutLoc, { dryRun })) {
                    changes++;
                }
            }
        }
        const apiI18nEn = this.i18nService.getApiMessages('en');
        // 生成 VoAPI 接口
        console.log('Generating VoAPI endpoints...');
        const voapiDir = join(this.API_DIR, 'voapi');
        ensureDirSync(voapiDir);
        const voapiPayload = this.voApiBuilder.buildFirms(allModelsData);
        if (writeJSONIfChanged(join(voapiDir, 'firms.json'), { success: true, message: '', data: voapiPayload.firms }, { dryRun })) {
            changes++;
        }
        if (writeJSONIfChanged(join(voapiDir, 'models.json'), { success: true, message: '', data: voapiPayload.models }, { dryRun })) {
            changes++;
        }
        // 生成多语言 VoAPI locales 输出至 api/i18n/<locale>/voapi）
        {
            const locales = this.i18nService.getLocales().map((l) => l.locale);
            const i18nBase = join(this.API_DIR, 'i18n');
            ensureDirSync(i18nBase);
            for (const locale of locales) {
                const outDir = join(i18nBase, locale, 'voapi');
                ensureDirSync(outDir);
                const localized = this.dataProcessor.localizeNormalizedData(allModelsData, overrides, locale);
                const voapiPayload = this.voApiBuilder.buildFirms(localized);
                if (writeJSONIfChanged(join(outDir, 'firms.json'), { success: true, message: '', data: voapiPayload.firms }, { dryRun })) {
                    changes++;
                }
                if (writeJSONIfChanged(join(outDir, 'models.json'), { success: true, message: '', data: voapiPayload.models }, { dryRun })) {
                    changes++;
                }
            }
        }
        // 生成 NewAPI 接口
        console.log('Generating NewAPI endpoints...');
        const newapiDir = join(this.API_DIR, 'newapi');
        ensureDirSync(newapiDir);
        // 基于默认英文映射生成 tags（保持 NewAPI 输出稳定性）
        const tagMapEn = {
            ...(apiI18nEn.capability_labels || {}),
        };
        // 使用英文本地化数据集，以便提供商的国际化信息（如描述）应用于基础 NewAPI 输出
        const allModelsDataEn = this.dataProcessor.localizeNormalizedData(allModelsData, overrides, 'en');
        const newapiSync = newApiBuilder.buildSyncPayload(allModelsDataEn, tagMapEn);
        newapiSync.warnings.forEach((w) => newApiWarnings.add(w));
        if (writeJSONIfChanged(join(newapiDir, 'vendors.json'), { success: true, message: '', data: newapiSync.vendors }, { dryRun })) {
            changes++;
        }
        if (writeJSONIfChanged(join(newapiDir, 'models.json'), { success: true, message: '', data: newapiSync.models }, { dryRun })) {
            changes++;
        }
        const priceConfig = newApiBuilder.buildPriceConfig(allModelsData);
        priceConfig.warnings.forEach((w) => newApiWarnings.add(w));
        if (writeJSONIfChanged(join(newapiDir, 'ratio_config-v1-base.json'), priceConfig.config, {
            dryRun,
        })) {
            changes++;
        }
        // 按提供商生成 NewAPI 价格配置（并清理已被过滤供应商的目录）
        {
            const providersBaseDir = join(newapiDir, 'providers');
            ensureDirSync(providersBaseDir);
            const keepProviderDirs = new Set(Object.keys(allModelsData.providers).map(sanitizeFileSegment));
            changes += pruneSubdirectories(providersBaseDir, keepProviderDirs, { dryRun });
            for (const providerId of Object.keys(allModelsData.providers)) {
                const safeProvider = sanitizeFileSegment(providerId);
                const outDir = join(providersBaseDir, safeProvider);
                ensureDirSync(outDir);
                const providerPriceConfig = newApiBuilder.buildPriceConfig(allModelsData, providerId);
                providerPriceConfig.warnings.forEach((w) => newApiWarnings.add(w));
                if (writeJSONIfChanged(join(outDir, 'ratio_config-v1-base.json'), providerPriceConfig.config, { dryRun })) {
                    changes++;
                }
            }
        }
        // 生成多语言 NewAPI（按 locales 输出至 api/i18n/<locale>/newapi）
        {
            const locales = this.i18nService.getLocales().map((l) => l.locale);
            const i18nBase = join(this.API_DIR, 'i18n');
            ensureDirSync(i18nBase);
            for (const locale of locales) {
                const apiMsg = this.i18nService.getApiMessages(locale);
                const tagMap = {
                    ...(apiMsg.capability_labels || {}),
                };
                const outDir = join(i18nBase, locale, 'newapi');
                ensureDirSync(outDir);
                const localized = this.dataProcessor.localizeNormalizedData(allModelsData, overrides, locale);
                const payload = newApiBuilder.buildSyncPayload(localized, tagMap);
                payload.warnings.forEach((w) => newApiWarnings.add(w));
                if (writeJSONIfChanged(join(outDir, 'vendors.json'), { success: true, message: '', data: payload.vendors }, { dryRun })) {
                    changes++;
                }
                if (writeJSONIfChanged(join(outDir, 'models.json'), { success: true, message: '', data: payload.models }, { dryRun })) {
                    changes++;
                }
            }
        }
        warnings.push(...newApiWarnings);
        // 镜像供应商 logo（Web UI 同源加载，摆脱第三方主机可达性依赖）
        console.log('Mirroring provider logos...');
        const logoResult = await mirrorProviderLogos(allModelsData.providers, { cacheDir: join(this.CACHE_DIR, 'logos'), outDir: join(this.API_DIR, 'logos') }, { dryRun, force });
        changes += logoResult.changes;
        warnings.push(...logoResult.warnings);
        // 写入单独的提供商和模型文件
        console.log('Writing individual provider and model files...');
        changes += this.writeProvidersAndModels(this.API_DIR, allModelsData, policy, sourceProviderIds, {
            dryRun,
            force,
        });
        // 写入 i18n 的提供商与模型文件
        {
            console.log('Writing i18n provider and model files...');
            const locales = this.i18nService.getLocales().map((l) => l.locale);
            const i18nDir = join(this.API_DIR, 'i18n');
            for (const locale of locales) {
                const outDir = join(i18nDir, locale);
                ensureDirSync(outDir);
                const localized = this.dataProcessor.localizeNormalizedData(allModelsData, overrides, locale);
                changes += this.writeProvidersAndModels(outDir, localized, policy, sourceProviderIds, {
                    dryRun,
                    force,
                });
            }
        }
        // 生成构建清单
        const manifest = this.computeManifest({
            sourceHash,
            overridesHash,
            policyHash,
            nativeProvidersHash,
            stats: {
                providers: indexes.providers.length,
                models: indexes.models.length,
                excludedProviders: filtered.excludedProviders,
                excludedModels: filtered.excludedModels,
                filesChanged: changes,
                dryRun,
            },
            ...(warnings.length > 0 && { warnings }),
        });
        if (writeJSONIfChanged(join(this.API_DIR, 'manifest.json'), manifest, { dryRun })) {
            changes++;
        }
        // 输出结果
        const mode = dryRun ? 'check' : 'build';
        const hasChanges = changes > 0;
        const action = dryRun
            ? hasChanges
                ? 'Will update'
                : 'No changes'
            : hasChanges
                ? 'Updated'
                : 'No changes';
        const message = hasChanges ? `${action} ${changes} file(s)` : action;
        console.log(`[${mode}] ${message}`);
        if (warnings.length > 0) {
            for (const warning of warnings) {
                console.warn('[warn]', warning);
            }
        }
        if (dryRun && hasChanges) {
            process.exit(2); // 非零退出，供 CI 检测变化
        }
    }
}
/** 主函数 */
async function main() {
    try {
        const args = parseArgv(process.argv);
        const config = {
            dryRun: !!args.check,
            force: !!args.force,
        };
        const builder = new Builder();
        await builder.build(config);
    }
    catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}
// 运行主函数（跨平台的入口判断，Windows 下 argv[1] 为反斜杠路径）
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
//# sourceMappingURL=build.js.map