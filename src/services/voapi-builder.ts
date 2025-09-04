import type { VoAPIFirm, NormalizedData, VoAPIApiSyncPayload, VoAPIModel } from '../types/index.js';
import { buildModelPriceInfo, buildModelTags } from '../utils/format-utils.js';

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
      let tagIcon = (provider.lobeIcon || '').toLowerCase().replaceAll('.', '-');
      if (tagIcon != '') {
        tagIcon = `lb:${tagIcon}`;
      }
      firms.push({
        id: providerId,
        name: provider.name || providerId,
        description: provider.description || '',
        icon: tagIcon || provider.iconURL || '',
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
        let tagIcon = (model.icon || provider.icon || provider.lobeIcon || '')
          .toLowerCase()
          .replaceAll('.', '-');
        if (tagIcon != '') {
          tagIcon = `lb:${tagIcon}`;
        }
        const price = buildModelPriceInfo(model.cost);
        const modalities = [
          ...(model.modalities?.input || []),
          ...(model.modalities?.output || []),
        ];
        models.push({
          id: modelId,
          name: model.name || modelId,
          description: model.description || '',
          tags: buildModelTags(model, tagMap),
          flags: {
            attachment: !!model.attachment,
            reasoning: !!model.reasoning,
            tool_call: !!model.tool_call,
            temperature: !!model.temperature,
            image: modalities.includes('image'),
            audio: modalities.includes('audio'),
          },
          maxCtxTokens: model.limit?.context || 0,
          maxOutputTokens: model.limit?.output || 0,
          firm: providerId,
          icon: tagIcon,
          price: price,
        });
      }
    }

    return { firms, models };
  }
}
