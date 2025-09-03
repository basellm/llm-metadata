import type { VoAPIFirm, NormalizedData } from '../types/index.js';

/** VoAPI 构建服务 */
export class VoAPIBuilder {
  /** 构建 VoAPI 模型供应商格式数据 */
  buildFirms(allModelsData: NormalizedData): VoAPIFirm[] {
    const firms: VoAPIFirm[] = [];

    const providerIds = Object.keys(allModelsData.providers).sort();

    for (const providerId of providerIds) {
      const provider = allModelsData.providers[providerId];
      // 构建供应商数据
      let tagIcon = (provider.icon || provider.lobeIcon || '').toLowerCase().replaceAll('.', '-');
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
    }

    return firms;
  }
}
