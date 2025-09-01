#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DataLoader } from './services/data-loader.js';
import { DataProcessor } from './services/data-processor.js';
import { DocumentationGenerator } from './services/docs-generator.js';
import { IndexBuilder } from './services/index-builder.js';
import { NewApiBuilder } from './services/newapi-builder.js';
import { parseArgv } from './utils/cli-utils.js';
import { copyDirSyncIfExists, ensureDirSync, removeNonJsonFiles, sanitizeFileSegment, writeJSONIfChanged, writeTextIfChanged, } from './utils/file-utils.js';
import { sha256OfObject, stableStringify } from './utils/object-utils.js';
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
    docsGenerator;
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
        this.docsGenerator = new DocumentationGenerator(this.ROOT);
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
            // 生成 NewAPI 接口
            console.log('Generating NewAPI endpoints...');
            const newapiDir = join(this.API_DIR, 'newapi');
            ensureDirSync(newapiDir);
            const newapiSync = this.newApiBuilder.buildSyncPayload(allModelsData);
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
            const dataMarkdown = this.docsGenerator.generateDataMarkdown(allModelsData, indexes.providers, manifest);
            const dataMarkdownPath = join(this.ROOT, 'docs', 'data.md');
            if (writeTextIfChanged(dataMarkdownPath, dataMarkdown, { dryRun })) {
                changes++;
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