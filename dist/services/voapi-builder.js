import { normalizeCostToPlane } from '../billing/plane.js';
import { buildModelPriceInfo, explicitTags } from '../utils/format-utils.js';
/** 计算 lobeIcon 为 VoAPI 支持的图标格式 */
function toVoAPIIcon(raw) {
    const icon = raw.toLowerCase().replaceAll('.', '-');
    return icon ? `lb:${icon}` : '';
}
/** VoAPI 构建服务（价格换算到 USD 平面输出；无汇率的货币留空） */
export class VoAPIBuilder {
    rates;
    constructor(rates) {
        this.rates = rates;
    }
    /** 构建 VoAPI 模型供应商格式数据（标签仅保留显式标签，不含能力/模态/上下文窗口） */
    buildFirms(allModelsData, tagMap) {
        const firms = [];
        const models = [];
        const translate = (key) => tagMap?.[key] ?? key;
        const providerIds = Object.keys(allModelsData.providers).sort();
        for (const providerId of providerIds) {
            // 构建供应商数据
            const provider = allModelsData.providers[providerId];
            const firmIcon = toVoAPIIcon(provider.lobeIcon || '');
            firms.push({
                id: providerId,
                name: provider.name || providerId,
                description: provider.description || '',
                icon: firmIcon || provider.iconURL || '',
                modelCount: Object.keys(provider.models || {}).length,
                api: provider.api || '',
                doc: provider.doc || '',
                status: 1,
            });
            // 构建模型数据
            const modelEntries = Object.entries(provider.models || {}).sort(([a], [b]) => a.localeCompare(b));
            for (const [modelId, model] of modelEntries) {
                const modelIcon = toVoAPIIcon(model.icon || provider.icon || provider.lobeIcon || '');
                const price = buildModelPriceInfo(normalizeCostToPlane(model.cost, this.rates).cost);
                const inputMods = model.modalities?.input || ['text'];
                const outputMods = model.modalities?.output || ['text'];
                const allMods = [...inputMods, ...outputMods];
                models.push({
                    id: modelId,
                    name: model.name || modelId,
                    description: model.description || '',
                    tags: [...new Set(explicitTags(model).map(translate))],
                    flags: {
                        attachment: !!model.attachment,
                        reasoning: !!model.reasoning,
                        tool_call: !!model.tool_call,
                        temperature: !!model.temperature,
                        image: allMods.includes('image'),
                        audio: allMods.includes('audio'),
                        open_weights: !!model.open_weights,
                    },
                    modalities: {
                        input: inputMods,
                        output: outputMods,
                    },
                    maxCtxTokens: model.limit?.context || 0,
                    maxOutputTokens: model.limit?.output || 0,
                    releaseDate: model.release_date || null,
                    lastUpdated: model.last_updated || null,
                    knowledge: model.knowledge || null,
                    firm: providerId,
                    icon: modelIcon,
                    price: price,
                });
            }
        }
        return { firms, models };
    }
}
//# sourceMappingURL=voapi-builder.js.map