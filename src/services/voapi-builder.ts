import type { VoAPIFirm, NormalizedData, VoAPIApiSyncPayload, VoAPIModel } from '../types/index.js';
import { buildModelPriceInfo } from '../utils/format-utils.js';

/** 构建 VoAPI 专用标签（仅保留显式标签，不含能力/模态/上下文窗口） */
function buildVoAPITags(model: any, map?: Record<string, string>): string[] {
  const tagSet = new Set<string>();
  const translate = (key: string) => map?.[key] ?? key;

  // 仅处理显式标签
  const tags = Array.isArray(model.tags)
    ? model.tags
    : typeof model.tags === 'string'
      ? model.tags.split(/[;,\s]+/g)
      : [];

  tags.forEach((tag: any) => {
    const trimmed = String(tag).trim();
    if (trimmed) tagSet.add(translate(trimmed));
  });

  return Array.from(tagSet);
}

/** 计算 lobeIcon 为 VoAPI 支持的图标格式 */
function toVoAPIIcon(raw: string): string {
  const icon = (raw || '').toLowerCase().replaceAll('.', '-');
  return icon ? `lb:${icon}` : '';
}

/** VoAPI 构建服务 */
export class VoAPIBuilder {
  /** 构建 VoAPI 模型供应商格式数据 */
  buildFirms(allModelsData: NormalizedData, tagMap?: Record<string, string>): VoAPIApiSyncPayload {
    const firms: VoAPIFirm[] = [];
    const models: VoAPIModel[] = [];

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
        modelCount: Object.entries(provider.models || {}).length || 0,
        api: provider.api || '',
        doc: provider.doc || '',
        status: 1,
      });

      // 构建模型数据
      const modelEntries = Object.entries(provider.models || {}).sort(([a], [b]) =>
        a.localeCompare(b),
      );

      for (const [modelId, model] of modelEntries) {
        const modelIcon = toVoAPIIcon(model.icon || provider.icon || provider.lobeIcon || '');
        const price = buildModelPriceInfo(model.cost);
        const inputMods = model.modalities?.input || ['text'];
        const outputMods = model.modalities?.output || ['text'];
        const allMods = [...inputMods, ...outputMods];
        models.push({
          id: modelId,
          name: model.name || modelId,
          description: model.description || '',
          tags: buildVoAPITags(model, tagMap),
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
