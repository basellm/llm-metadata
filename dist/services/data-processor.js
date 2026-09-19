import { deepMerge } from '../utils/object-utils.js';
/** 数据处理服务 */
export class DataProcessor {
    i18n;
    constructor(i18n) {
        this.i18n = i18n;
    }
    /** 创建模型键 */
    createModelKey(providerId, modelId) {
        return `${providerId}/${modelId}`;
    }
    /** 按 locale 生成默认描述（fallback 到英文模板） */
    generateDefaultDescription(modelName, providerId, locale = 'en') {
        const tpl = this.i18n.getApiMessages(locale).defaults?.model_description ||
            this.i18n.getApiMessages('en').defaults?.model_description ||
            '${modelName} is an AI model provided by ${providerId}.';
        return tpl.replace('${modelName}', modelName).replace('${providerId}', providerId);
    }
    /** 检查是否允许自动更新 */
    shouldAutoUpdate(policy, providerId, modelId) {
        const modelKey = this.createModelKey(providerId, modelId);
        const modelPolicy = policy.models?.[modelKey]?.auto;
        const providerPolicy = policy.providers?.[providerId]?.auto;
        // 优先级: 模型 > 提供商 > 默认(true)
        if (typeof modelPolicy === 'boolean')
            return modelPolicy;
        if (typeof providerPolicy === 'boolean')
            return providerPolicy;
        return true;
    }
    /**
     * 应用模型级覆写。默认深合并；但覆写的 cost 声明了结算货币时整体替换成本对象：
     * 货币切换意味着每个价格都换了单位，深合并会让上游其他货币的数值（如未固定的 cache_read）残留。
     */
    applyModelOverride(model, override) {
        if (!override)
            return model;
        const merged = deepMerge(model, override);
        if (override.cost?.currency)
            merged.cost = override.cost;
        return merged;
    }
    /** 应用 i18n 覆写的英文文案（其它语言在本地化阶段切换） */
    applyEnglishI18n(model, i18nModel) {
        if (!i18nModel)
            return model;
        return {
            ...model,
            ...(i18nModel.name?.en ? { name: i18nModel.name.en } : {}),
            ...(i18nModel.description?.en ? { description: i18nModel.description.en } : {}),
        };
    }
    /** 处理单个模型数据 */
    processModel(modelData, modelId, providerId, overrides) {
        const modelKey = this.createModelKey(providerId, modelId);
        let processed = { ...modelData };
        // 确保每个模型都有描述
        if (!processed.description) {
            processed.description = this.generateDefaultDescription(processed.name || modelId, providerId);
        }
        processed = this.applyModelOverride(processed, overrides.models?.[modelKey]);
        return this.applyEnglishI18n(processed, overrides.i18n?.models?.[modelKey]);
    }
    /** 处理单个提供商数据 */
    processProvider(provider, providerId, overrides, sourceProviderIds) {
        // 应用提供商级覆写
        const providerOverride = overrides.providers?.[providerId];
        let processed = providerOverride ? deepMerge(provider, providerOverride) : provider;
        // 添加图标URL（如果来自源数据）
        if (sourceProviderIds.has(providerId)) {
            processed = deepMerge(processed, {
                iconURL: `https://models.dev/logos/${providerId}.svg`,
            });
        }
        // 处理所有模型
        const processedModels = {};
        for (const [modelId, modelData] of Object.entries(provider.models || {})) {
            processedModels[modelId] = this.processModel(modelData, modelId, providerId, overrides);
        }
        // 基于 overrides 注入不存在的模型（允许仅通过 overrides.models 新增模型）
        for (const [modelKey, override] of Object.entries(overrides.models || {})) {
            const [provId, modId] = modelKey.split('/');
            if (provId !== providerId || processedModels[modId])
                continue;
            const baseName = override.name || modId;
            const created = {
                id: modId,
                name: baseName,
                description: this.generateDefaultDescription(baseName, providerId),
            };
            processedModels[modId] = this.applyEnglishI18n(this.applyModelOverride(created, override), overrides.i18n?.models?.[modelKey]);
        }
        return {
            ...processed,
            models: processedModels,
        };
    }
    /** 将源数据转换为规范化格式 */
    mapSourceToNormalized(source) {
        return { providers: source };
    }
    /** 注入手动添加的提供商 */
    injectManualProviders(normalized, overrides) {
        const result = { ...normalized };
        for (const [providerId, providerOverride] of Object.entries(overrides.providers || {})) {
            if (!result.providers[providerId]) {
                const baseProvider = {
                    id: providerId,
                    models: {},
                    ...providerOverride,
                };
                result.providers[providerId] = baseProvider;
            }
        }
        // 若 overrides.models 中引用了新的 provider，也需要注入一个占位提供商
        for (const modelKey of Object.keys(overrides.models || {})) {
            const [provId] = modelKey.split('/');
            if (!result.providers[provId]) {
                result.providers[provId] = {
                    id: provId,
                    models: {},
                };
            }
        }
        return result;
    }
    /** 处理所有数据 */
    processAllData(normalized, overrides, sourceProviderIds) {
        const processed = {};
        for (const [providerId, provider] of Object.entries(normalized.providers)) {
            processed[providerId] = this.processProvider(provider, providerId, overrides, sourceProviderIds);
        }
        return { providers: processed };
    }
    /**
     * 根据 locale 应用 i18n 文案到标准化数据（返回新对象）。
     * 模型描述的解析顺序：人工覆写（data/overrides/i18n）→ 翻译记忆（i18n/descriptions）
     * → 默认描述模板 → 保留英文（计入 untranslated）。
     */
    localizeNormalizedData(data, overrides, locale) {
        const localizedProviders = {};
        const translations = this.i18n.getDescriptionTranslations(locale);
        const untranslated = [];
        for (const [providerId, provider] of Object.entries(data.providers)) {
            const provI18n = overrides.i18n?.providers?.[providerId];
            const name = provI18n?.name?.[locale] ?? provider.name;
            const description = provI18n?.description?.[locale] ?? provider.description;
            const localizedModels = {};
            for (const [modelId, model] of Object.entries(provider.models || {})) {
                const key = this.createModelKey(providerId, modelId);
                const modI18n = overrides.i18n?.models?.[key];
                const newModel = { ...model };
                const modelName = modI18n?.name?.[locale];
                if (modelName !== undefined)
                    newModel.name = modelName;
                const overrideDesc = modI18n?.description?.[locale];
                const source = model.description;
                if (overrideDesc !== undefined) {
                    newModel.description = overrideDesc;
                }
                else if (source && translations[source] !== undefined) {
                    newModel.description = translations[source];
                }
                else if (locale !== 'en' && source) {
                    // 若原描述等于英文默认描述（以处理阶段的英文名生成），则替换为对应语言模板
                    if (source === this.generateDefaultDescription(model.name || modelId, providerId)) {
                        newModel.description = this.generateDefaultDescription(newModel.name || modelId, providerId, locale);
                    }
                    else {
                        untranslated.push(source);
                    }
                }
                localizedModels[modelId] = newModel;
            }
            localizedProviders[providerId] = {
                ...provider,
                ...(name ? { name } : {}),
                ...(description ? { description } : {}),
                models: localizedModels,
            };
        }
        return { data: { providers: localizedProviders }, untranslated };
    }
}
//# sourceMappingURL=data-processor.js.map