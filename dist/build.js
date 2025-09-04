#!/usr/bin/env node
import { writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DataLoader } from './services/data-loader.js';
import { DataProcessor } from './services/data-processor.js';
import { DocumentationGenerator } from './services/docs-generator.js';
import { IndexBuilder } from './services/index-builder.js';
import { NewApiBuilder } from './services/newapi-builder.js';
import { I18nService } from './services/i18n-service.js';
import { parseArgv } from './utils/cli-utils.js';
import { copyDirSyncIfExists, ensureDirSync, removeNonJsonFiles, sanitizeFileSegment, writeJSONIfChanged, writeTextIfChanged, } from './utils/file-utils.js';
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
    newApiBuilder;
    voApiBuilder;
    docsGenerator;
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
        this.newApiBuilder = new NewApiBuilder();
        this.newApiBuilder = new NewApiBuilder();
        this.voApiBuilder = new VoAPIBuilder();
        this.docsGenerator = new DocumentationGenerator(this.ROOT);
        this.i18nService = new I18nService(this.ROOT);
    }
    /** 校验 mkdocs.yml 中的语言与 i18n/locales.json 一致性，返回警告 */
    validateMkdocsLocales(expectedLocales) {
        const warnings = [];
        try {
            const mkdocsPath = join(this.ROOT, 'mkdocs.yml');
            const content = readFileSync(mkdocsPath, 'utf8');
            const pluginLocales = Array.from(content.matchAll(/-\s*locale:\s*([A-Za-z0-9_-]+)/g)).map((m) => m[1]);
            const altLocales = Array.from(content.matchAll(/\blang:\s*([A-Za-z0-9_-]+)/g)).map((m) => m[1]);
            const uniq = (arr) => Array.from(new Set(arr));
            const expected = new Set(expectedLocales);
            const plugin = new Set(uniq(pluginLocales));
            const alternate = new Set(uniq(altLocales));
            const diff = (a, b) => Array.from(a).filter((x) => !b.has(x));
            const missingInPlugin = diff(expected, plugin);
            const extraInPlugin = diff(plugin, expected);
            const missingInAlternate = diff(expected, alternate);
            const extraInAlternate = diff(alternate, expected);
            if (missingInPlugin.length)
                warnings.push(`mkdocs i18n.languages missing: ${missingInPlugin.join(', ')}`);
            if (extraInPlugin.length)
                warnings.push(`mkdocs i18n.languages extra: ${extraInPlugin.join(', ')}`);
            if (missingInAlternate.length)
                warnings.push(`mkdocs extra.alternate missing: ${missingInAlternate.join(', ')}`);
            if (extraInAlternate.length)
                warnings.push(`mkdocs extra.alternate extra: ${extraInAlternate.join(', ')}`);
        }
        catch (e) {
            warnings.push(`Failed to validate mkdocs.yml locales: ${e.message}`);
        }
        return warnings;
    }
    /** 写入提供商和模型文件（返回变更数） */
    writeProvidersAndModels(baseDir, dataset, policy, sourceProviderIds, options) {
        let changes = 0;
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
            const providerPath = join(baseDir, 'providers', `${safeProvider}.json`);
            if (writeJSONIfChanged(providerPath, providerOut, options)) {
                changes++;
            }
            // 模型文件
            const providerModelsDir = join(baseDir, 'models', safeProvider);
            ensureDirSync(providerModelsDir);
            removeNonJsonFiles(providerModelsDir, options);
            for (const [modelId, modelData] of Object.entries(provider.models || {})) {
                const allowAuto = this.dataProcessor.shouldAutoUpdate(policy, providerId, modelId);
                const existing = this.dataLoader.readJSONSafe(join(providerModelsDir, `${sanitizeFileSegment(modelId)}.json`), null);
                if (!options.dryRun && !allowAuto && existing) {
                    continue;
                }
                const modelPath = join(providerModelsDir, `${sanitizeFileSegment(modelId)}.json`);
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
            stats: params.stats,
        };
        if (params.warnings) {
            result.warnings = params.warnings;
        }
        return result;
    }
    /** 主构建流程 */
    async build(config) {
        const { dryRun, force, docsMdOnly, apiOnly } = config;
        // 准备目录
        ensureDirSync(this.CACHE_DIR);
        ensureDirSync(this.DATA_DIR);
        if (!docsMdOnly) {
            ensureDirSync(this.DIST_DIR);
            ensureDirSync(this.API_DIR);
            copyDirSyncIfExists(join(this.ROOT, 'public'), this.DIST_DIR);
        }
        // 加载数据
        console.log('Loading source data...');
        const source = await this.dataLoader.loadSourceData(this.SOURCE_URL);
        // 缓存源数据
        writeFileSync(join(this.CACHE_DIR, 'api.json'), stableStringify(source), 'utf8');
        // 加载配置
        console.log('Loading configuration...');
        const overrides = this.dataLoader.loadOverrides();
        const policy = this.dataLoader.loadPolicy();
        // 处理数据
        console.log('Processing data...');
        let normalized = this.dataProcessor.mapSourceToNormalized(source);
        const sourceProviderIds = new Set(Object.keys(source));
        // 注入手动提供商
        normalized = this.dataProcessor.injectManualProviders(normalized, overrides);
        // 处理所有数据
        const allModelsData = this.dataProcessor.processAllData(normalized, overrides, sourceProviderIds);
        // 构建索引
        console.log('Building indexes...');
        const indexes = this.indexBuilder.buildIndexes(allModelsData, overrides);
        const providersOutput = this.indexBuilder.buildProvidersOutput(indexes);
        // 计算哈希
        const sourceHash = sha256OfObject(source);
        const overridesHash = sha256OfObject(overrides);
        const policyHash = sha256OfObject(policy);
        let changes = 0;
        const warnings = [];
        if (!docsMdOnly) {
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
            const newapiSync = this.newApiBuilder.buildSyncPayload(allModelsDataEn, tagMapEn);
            if (writeJSONIfChanged(join(newapiDir, 'vendors.json'), { success: true, message: '', data: newapiSync.vendors }, { dryRun })) {
                changes++;
            }
            if (writeJSONIfChanged(join(newapiDir, 'models.json'), { success: true, message: '', data: newapiSync.models }, { dryRun })) {
                changes++;
            }
            const priceConfig = this.newApiBuilder.buildPriceConfig(allModelsData);
            if (writeJSONIfChanged(join(newapiDir, 'ratio_config-v1-base.json'), priceConfig, { dryRun })) {
                changes++;
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
                    const payload = this.newApiBuilder.buildSyncPayload(localized, tagMap);
                    if (writeJSONIfChanged(join(outDir, 'vendors.json'), { success: true, message: '', data: payload.vendors }, { dryRun })) {
                        changes++;
                    }
                    if (writeJSONIfChanged(join(outDir, 'models.json'), { success: true, message: '', data: payload.models }, { dryRun })) {
                        changes++;
                    }
                }
            }
            // 写入单独的提供商和模型文件
            console.log('Writing individual provider and model files...');
            for (const [providerId, provider] of Object.entries(allModelsData.providers)) {
                const safeProvider = sanitizeFileSegment(providerId);
                // 提供商文件
                let providerOut = { ...provider };
                if (sourceProviderIds.has(providerId)) {
                    providerOut = {
                        ...providerOut,
                        iconURL: `https://models.dev/logos/${providerId}.svg`,
                    };
                }
                const providerPath = join(this.API_DIR, 'providers', `${safeProvider}.json`);
                if (writeJSONIfChanged(providerPath, providerOut, { dryRun })) {
                    changes++;
                }
                // 模型文件
                const providerModelsDir = join(this.API_DIR, 'models', safeProvider);
                ensureDirSync(providerModelsDir);
                removeNonJsonFiles(providerModelsDir, { dryRun });
                const models = provider.models || {};
                for (const [modelId, modelData] of Object.entries(models)) {
                    const allowAuto = this.dataProcessor.shouldAutoUpdate(policy, providerId, modelId);
                    const safeModel = sanitizeFileSegment(modelId);
                    const modelPath = join(providerModelsDir, `${safeModel}.json`);
                    // 检查现有文件
                    const existing = this.dataLoader.readJSONSafe(modelPath, null);
                    if (!force && !allowAuto && existing) {
                        continue; // 跳过非自动模式的现有文件
                    }
                    if (writeJSONIfChanged(modelPath, modelData, { dryRun })) {
                        changes++;
                    }
                }
            }
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
                    });
                }
            }
        }
        // 生成构建清单
        const manifest = this.computeManifest({
            sourceHash,
            overridesHash,
            policyHash,
            stats: {
                providers: indexes.providers.length,
                models: indexes.models.length,
                filesChanged: changes,
                dryRun,
            },
            ...(warnings.length > 0 && { warnings }),
        });
        if (!docsMdOnly) {
            if (writeJSONIfChanged(join(this.API_DIR, 'manifest.json'), manifest, { dryRun })) {
                changes++;
            }
        }
        // 生成文档
        if (!apiOnly) {
            console.log('Generating documentation...');
            const locales = this.i18nService.getLocales().map((l) => l.locale);
            for (const locale of locales) {
                const md = this.docsGenerator.generateDataMarkdown(allModelsData, indexes.providers, manifest, locale);
                const outPath = join(this.ROOT, 'docs', locale, 'data.md');
                if (writeTextIfChanged(outPath, md, { dryRun })) {
                    changes++;
                }
            }
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
        // i18n 文档词条与 mkdocs 语言一致性校验（警告不影响结果）
        {
            const locales = this.i18nService.getLocales().map((l) => l.locale);
            const i18nWarnings = this.i18nService.validateDocMessages(locales);
            if (i18nWarnings.length > 0)
                warnings.push(...i18nWarnings);
            const mkdocsWarnings = this.validateMkdocsLocales(locales);
            if (mkdocsWarnings.length > 0)
                warnings.push(...mkdocsWarnings);
        }
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
            docsMdOnly: !!args['docs-md-only'] || !!args.docsMdOnly,
            apiOnly: !!args['api-only'] || !!args.apiOnly,
        };
        const builder = new Builder();
        await builder.build(config);
    }
    catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}
// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
//# sourceMappingURL=build.js.map