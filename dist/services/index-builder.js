import { deepMerge } from '../utils/object-utils.js';
/** 索引构建服务 */
export class IndexBuilder {
    /** 构建提供商和模型索引 */
    buildIndexes(normalized, overrides) {
        const providerIndex = [];
        const modelIndex = [];
        for (const [providerId, provider] of Object.entries(normalized.providers)) {
            // 合并提供商覆写配置
            const providerOverride = overrides.providers?.[providerId] || {};
            const effectiveProvider = deepMerge(provider, providerOverride);
            // 构建提供商索引项
            const providerInfo = {
                id: providerId,
                name: effectiveProvider.name || providerId,
                api: effectiveProvider.api || undefined,
                doc: effectiveProvider.doc || undefined,
                icon: effectiveProvider.icon || undefined,
                iconURL: effectiveProvider.iconURL || undefined,
                lobeIcon: effectiveProvider.lobeIcon || undefined,
                modelCount: 0,
            };
            // 构建模型索引项
            const models = provider.models || {};
            for (const [modelId, model] of Object.entries(models)) {
                providerInfo.modelCount++;
                modelIndex.push({
                    id: modelId,
                    providerId,
                    name: model.name || modelId,
                    updated: model.last_updated || model.release_date || undefined,
                    flags: {
                        attachment: !!model.attachment,
                        reasoning: !!model.reasoning,
                        tool_call: !!model.tool_call,
                    },
                });
            }
            providerIndex.push(providerInfo);
        }
        // 排序
        providerIndex.sort((a, b) => a.id.localeCompare(b.id));
        modelIndex.sort((a, b) => a.providerId.localeCompare(b.providerId) || a.id.localeCompare(b.id));
        return { providers: providerIndex, models: modelIndex };
    }
    /** 构建提供商索引输出 */
    buildProvidersOutput(indexes) {
        return { providers: indexes.providers };
    }
}
//# sourceMappingURL=index-builder.js.map