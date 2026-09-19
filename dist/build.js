#!/usr/bin/env node
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defaultDeployment, planeRates } from './billing/deployment.js';
import { catalogPaths, loadCatalog } from './services/catalog.js';
import { IndexBuilder } from './services/index-builder.js';
import { mirrorProviderLogos } from './services/logo-mirror.js';
import { NewApiBuilder } from './services/newapi-builder.js';
import { VoAPIBuilder } from './services/voapi-builder.js';
import { parseArgv } from './utils/cli-utils.js';
import { copyDirSyncIfExists, ensureDirSync, pruneFiles, pruneSubdirectories, removeNonJsonFiles, sanitizeFileSegment, writeJSONIfChanged, } from './utils/file-utils.js';
import { sha256OfObject } from './utils/object-utils.js';
/** 主构建类 */
class Builder {
    ROOT;
    DIST_DIR;
    API_DIR;
    paths;
    indexBuilder = new IndexBuilder();
    constructor() {
        this.ROOT = resolve(process.cwd());
        this.DIST_DIR = join(this.ROOT, 'dist');
        this.API_DIR = join(this.DIST_DIR, 'api');
        this.paths = catalogPaths(this.ROOT);
    }
    /** 写入提供商和模型文件并清理陈旧产物（返回变更数） */
    writeProvidersAndModels(baseDir, dataset, catalog, policy, options) {
        let changes = 0;
        const providersDir = join(baseDir, 'providers');
        const modelsBaseDir = join(baseDir, 'models');
        const keepProviders = new Set(Object.keys(dataset.providers).map(sanitizeFileSegment));
        // 清理已不在数据集中的供应商产物
        changes += pruneFiles(providersDir, keepProviders, '.json', options);
        changes += pruneSubdirectories(modelsBaseDir, keepProviders, options);
        for (const [providerId, provider] of Object.entries(dataset.providers)) {
            const safeProvider = sanitizeFileSegment(providerId);
            const providerPath = join(providersDir, `${safeProvider}.json`);
            if (writeJSONIfChanged(providerPath, provider, options)) {
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
                const allowAuto = catalog.processor.shouldAutoUpdate(policy, providerId, modelId);
                const modelPath = join(providerModelsDir, `${sanitizeFileSegment(modelId)}.json`);
                const existing = catalog.loader.readJSONSafe(modelPath, null);
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
    /** 写入 VoAPI 载荷（firms + models）并返回变更数 */
    writeVoApi(outDir, builder, dataset, dryRun) {
        ensureDirSync(outDir);
        const payload = builder.buildFirms(dataset);
        let changes = 0;
        for (const [name, data] of [
            ['firms.json', payload.firms],
            ['models.json', payload.models],
        ]) {
            if (writeJSONIfChanged(join(outDir, name), { success: true, message: '', data }, { dryRun })) {
                changes++;
            }
        }
        return changes;
    }
    /** 写入 NewAPI 元数据同步载荷（vendors + models）并返回变更数 */
    writeNewApiSync(outDir, builder, dataset, tagMap, dryRun) {
        ensureDirSync(outDir);
        const payload = builder.buildSyncPayload(dataset, tagMap);
        let changes = 0;
        for (const [name, data] of [
            ['vendors.json', payload.vendors],
            ['models.json', payload.models],
        ]) {
            if (writeJSONIfChanged(join(outDir, name), { success: true, message: '', data }, { dryRun })) {
                changes++;
            }
        }
        return changes;
    }
    /** 主构建流程 */
    async build(config) {
        const { dryRun, force } = config;
        // 准备目录
        ensureDirSync(this.DIST_DIR);
        ensureDirSync(this.API_DIR);
        copyDirSyncIfExists(join(this.ROOT, 'public'), this.DIST_DIR);
        const catalog = await loadCatalog(this.paths);
        const { overrides, policy, nativeFilter, data: allModelsData } = catalog;
        const warnings = [...catalog.warnings];
        // 每个语言只本地化一次，供数据集、VoAPI、NewAPI 与拆分文件复用
        console.log('Localizing datasets...');
        const locales = catalog.i18n.getLocales().map((l) => l.locale);
        const localized = new Map();
        for (const locale of locales) {
            const result = catalog.processor.localizeNormalizedData(allModelsData, overrides, locale);
            localized.set(locale, result.data);
            if (result.untranslated.length > 0) {
                warnings.push(`i18n: ${result.untranslated.length} model description(s) have no ${locale} translation (run "npm run translate")`);
            }
        }
        const enData = localized.get('en') ?? allModelsData;
        // 静态预设按 new-api 出厂部署生成（quota-USD 即真实美元），非美元价目按 exchangeRates 换算
        const exchangeRates = nativeFilter.getExchangeRates();
        const deployment = defaultDeployment(exchangeRates);
        const newApiBuilder = new NewApiBuilder(deployment, exchangeRates);
        const voApiBuilder = new VoAPIBuilder(planeRates(deployment, exchangeRates));
        const newApiWarnings = new Set();
        // 构建索引
        console.log('Building indexes...');
        const indexes = this.indexBuilder.buildIndexes(allModelsData, overrides);
        const providersOutput = this.indexBuilder.buildProvidersOutput(indexes);
        let changes = 0;
        // 写入主索引与完整数据
        console.log('Writing main indexes...');
        if (writeJSONIfChanged(join(this.API_DIR, 'index.json'), indexes, { dryRun }))
            changes++;
        if (writeJSONIfChanged(join(this.API_DIR, 'providers.json'), providersOutput, { dryRun })) {
            changes++;
        }
        console.log('Writing complete models data...');
        if (writeJSONIfChanged(join(this.API_DIR, 'all.json'), allModelsData.providers, { dryRun })) {
            changes++;
        }
        // i18n 版本的完整数据与索引
        const i18nDir = join(this.API_DIR, 'i18n');
        for (const [locale, dataset] of localized) {
            const outDir = join(i18nDir, locale);
            ensureDirSync(outDir);
            const indexesLoc = this.indexBuilder.buildIndexes(dataset, overrides);
            if (writeJSONIfChanged(join(outDir, 'all.json'), dataset.providers, { dryRun }))
                changes++;
            if (writeJSONIfChanged(join(outDir, 'index.json'), indexesLoc, { dryRun }))
                changes++;
            if (writeJSONIfChanged(join(outDir, 'providers.json'), this.indexBuilder.buildProvidersOutput(indexesLoc), { dryRun })) {
                changes++;
            }
        }
        // VoAPI（基础 + 多语言）
        console.log('Generating VoAPI endpoints...');
        changes += this.writeVoApi(join(this.API_DIR, 'voapi'), voApiBuilder, allModelsData, dryRun);
        for (const [locale, dataset] of localized) {
            changes += this.writeVoApi(join(i18nDir, locale, 'voapi'), voApiBuilder, dataset, dryRun);
        }
        // NewAPI 元数据（基础输出使用英文本地化数据集，保持稳定；tags 用英文标签）
        console.log('Generating NewAPI endpoints...');
        const newapiDir = join(this.API_DIR, 'newapi');
        const tagMapFor = (locale) => ({
            ...(catalog.i18n.getApiMessages(locale).capability_labels || {}),
        });
        changes += this.writeNewApiSync(newapiDir, newApiBuilder, enData, tagMapFor('en'), dryRun);
        for (const [locale, dataset] of localized) {
            changes += this.writeNewApiSync(join(i18nDir, locale, 'newapi'), newApiBuilder, dataset, tagMapFor(locale), dryRun);
        }
        // NewAPI 价格配置（聚合 + 按供应商，并清理已被过滤供应商的目录）
        const priceConfig = newApiBuilder.buildPriceConfig(allModelsData);
        priceConfig.warnings.forEach((w) => newApiWarnings.add(w));
        if (writeJSONIfChanged(join(newapiDir, 'ratio_config-v1-base.json'), priceConfig.config, {
            dryRun,
        })) {
            changes++;
        }
        {
            const providersBaseDir = join(newapiDir, 'providers');
            ensureDirSync(providersBaseDir);
            const keepProviderDirs = new Set(Object.keys(allModelsData.providers).map(sanitizeFileSegment));
            changes += pruneSubdirectories(providersBaseDir, keepProviderDirs, { dryRun });
            for (const providerId of Object.keys(allModelsData.providers)) {
                const outDir = join(providersBaseDir, sanitizeFileSegment(providerId));
                ensureDirSync(outDir);
                const providerPriceConfig = newApiBuilder.buildPriceConfig(allModelsData, providerId);
                providerPriceConfig.warnings.forEach((w) => newApiWarnings.add(w));
                if (writeJSONIfChanged(join(outDir, 'ratio_config-v1-base.json'), providerPriceConfig.config, { dryRun })) {
                    changes++;
                }
            }
        }
        warnings.push(...newApiWarnings);
        // 镜像供应商 logo（Web UI 同源加载，摆脱第三方主机可达性依赖）
        console.log('Mirroring provider logos...');
        const logoResult = await mirrorProviderLogos(allModelsData.providers, {
            cacheDir: join(this.paths.cacheDir, 'logos'),
            outDir: join(this.API_DIR, 'logos'),
        }, { dryRun, force });
        changes += logoResult.changes;
        warnings.push(...logoResult.warnings);
        // 写入单独的提供商和模型文件（基础 + 多语言）
        console.log('Writing individual provider and model files...');
        changes += this.writeProvidersAndModels(this.API_DIR, allModelsData, catalog, policy, {
            dryRun,
            force,
        });
        for (const [locale, dataset] of localized) {
            changes += this.writeProvidersAndModels(join(i18nDir, locale), dataset, catalog, policy, {
                dryRun,
                force,
            });
        }
        // 生成构建清单
        const manifest = {
            version: 1,
            generatedAt: new Date().toISOString(),
            sourceHash: sha256OfObject(catalog.source),
            overridesHash: sha256OfObject(overrides),
            policyHash: sha256OfObject(policy),
            nativeProvidersHash: sha256OfObject(catalog.nativeConfig ?? {}),
            stats: {
                providers: indexes.providers.length,
                models: indexes.models.length,
                excludedProviders: catalog.excludedProviders,
                excludedModels: catalog.excludedModels,
                filesChanged: changes,
                dryRun,
            },
            newapi: { exchangeRates },
            ...(warnings.length > 0 && { warnings }),
        };
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