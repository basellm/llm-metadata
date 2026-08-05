/**
 * 原生供应商过滤服务。
 *
 * 上游 models.dev 混杂了大量聚合商/转售商，本服务依据
 * data/native-providers.json 白名单只保留第一方（原生）供应商，
 * 并可按规则剔除原生供应商中托管的第三方模型。
 */
export class NativeFilter {
    config;
    excludePatterns = new Map();
    configWarnings = [];
    constructor(config) {
        this.config = config;
        if (!config)
            return;
        for (const [providerId, rule] of Object.entries(config.providers)) {
            const patterns = [];
            for (const pattern of rule.excludeModels || []) {
                try {
                    patterns.push(new RegExp(pattern, 'i'));
                }
                catch {
                    this.configWarnings.push(`native-providers: invalid excludeModels pattern "${pattern}" for "${providerId}" (ignored)`);
                }
            }
            if (patterns.length > 0) {
                this.excludePatterns.set(providerId, patterns);
            }
        }
        for (const [currency, rate] of Object.entries(config.exchangeRates || {})) {
            if (currency.startsWith('$'))
                continue; // $comment 等元数据键
            if (typeof rate !== 'number' || rate <= 0) {
                this.configWarnings.push(`native-providers: invalid exchange rate for "${currency}" (must be a positive number)`);
            }
        }
    }
    /** 是否启用过滤（配置缺失时构建保持全量并给出警告） */
    get enabled() {
        return this.config !== null;
    }
    /** 非 USD 货币兑美元汇率（每 1 USD 对应的货币数量） */
    getExchangeRates() {
        const rates = {};
        for (const [currency, rate] of Object.entries(this.config?.exchangeRates || {})) {
            if (!currency.startsWith('$') && typeof rate === 'number' && rate > 0) {
                rates[currency] = rate;
            }
        }
        return rates;
    }
    /** 供应商优先级映射（用于同名模型冲突解析） */
    getPriorities() {
        const priorities = {};
        for (const [providerId, rule] of Object.entries(this.config?.providers || {})) {
            if (typeof rule.priority === 'number') {
                priorities[providerId] = rule.priority;
            }
        }
        return priorities;
    }
    /** 应用白名单与模型排除规则 */
    apply(normalized) {
        if (!this.config) {
            return {
                data: normalized,
                excludedProviders: 0,
                excludedModels: 0,
                warnings: ['native-providers: data/native-providers.json not found; filtering disabled'],
            };
        }
        const warnings = [...this.configWarnings];
        const providers = {};
        let excludedProviders = 0;
        let excludedModels = 0;
        for (const [providerId, provider] of Object.entries(normalized.providers)) {
            const rule = this.config.providers[providerId];
            if (!rule) {
                excludedProviders++;
                continue;
            }
            // 目录中的 lobeIcon 注入供应商数据（用于 NewAPI vendors 图标），不覆盖已有值
            const enriched = rule.lobeIcon && !provider.lobeIcon ? { ...provider, lobeIcon: rule.lobeIcon } : provider;
            const patterns = this.excludePatterns.get(providerId);
            if (!patterns) {
                providers[providerId] = enriched;
                continue;
            }
            const models = {};
            for (const [modelId, model] of Object.entries(enriched.models || {})) {
                if (patterns.some((pattern) => pattern.test(modelId))) {
                    excludedModels++;
                }
                else {
                    models[modelId] = model;
                }
            }
            providers[providerId] = { ...enriched, models };
        }
        // 配置漂移检测：白名单中的供应商在上游消失时提醒维护者
        for (const providerId of Object.keys(this.config.providers)) {
            if (!normalized.providers[providerId]) {
                warnings.push(`native-providers: "${providerId}" not found in source data`);
            }
        }
        return { data: { providers }, excludedProviders, excludedModels, warnings };
    }
}
//# sourceMappingURL=native-filter.js.map