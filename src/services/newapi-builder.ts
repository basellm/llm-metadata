import type {
  ModelCost,
  NewApiModel,
  NewApiPriceConfig,
  NewApiRatios,
  NewApiSyncPayload,
  NewApiVendor,
  NormalizedData,
} from '../types/index.js';
import { formatTokensToKM } from '../utils/format-utils.js';

/** NewAPI 构建服务 */
export class NewApiBuilder {
  /** 计算 NewAPI 价格比率 */
  private calculateRatios(cost?: ModelCost): NewApiRatios | null {
    if (!cost?.input || typeof cost.input !== 'number' || cost.input <= 0) {
      return null;
    }

    const ratios: NewApiRatios = {
      model: cost.input / 2, // 基准: $2 per 1M tokens
      completion: null,
      cache: null,
    };

    if (typeof cost.output === 'number' && cost.output > 0) {
      ratios.completion = cost.output / cost.input;
    }

    if (typeof cost.cache_read === 'number' && cost.cache_read > 0) {
      ratios.cache = cost.cache_read / cost.input;
    }

    return ratios;
  }

  /** 构建模型标签字符串 */
  private buildModelTags(model: any): string {
    const tagSet = new Set<string>();

    // 处理显式标签
    if (Array.isArray(model.tags)) {
      for (const tag of model.tags) {
        if (tag) tagSet.add(String(tag).trim());
      }
    } else if (typeof model.tags === 'string') {
      model.tags.split(/[;,\s]+/g).forEach((tag: string) => {
        const t = tag.trim();
        if (t) tagSet.add(t);
      });
    }

    // 基于能力添加标签
    if (model.reasoning) tagSet.add('reasoning');
    if (model.tool_call) tagSet.add('tools');
    if (model.attachment) tagSet.add('files');
    if (model.open_weights) tagSet.add('open-weights');

    // 基于模态添加标签
    const inputMods = model.modalities?.input || [];
    const outputMods = model.modalities?.output || [];
    const allMods = [...inputMods, ...outputMods];

    if (allMods.includes('image')) tagSet.add('vision');
    if (allMods.includes('audio')) tagSet.add('audio');

    // 添加上下文窗口标签
    const contextLimit = model.limit?.context;
    const contextTag = formatTokensToKM(contextLimit);
    if (contextTag) tagSet.add(contextTag);

    return Array.from(tagSet).join(',');
  }

  /** 构建 NewAPI 同步载荷 */
  buildSyncPayload(allModelsData: NormalizedData): NewApiSyncPayload {
    const vendors: NewApiVendor[] = [];
    const models: NewApiModel[] = [];

    const providerIds = Object.keys(allModelsData.providers).sort();

    for (const providerId of providerIds) {
      const provider = allModelsData.providers[providerId];

      // 构建供应商数据
      vendors.push({
        name: provider.name || providerId,
        description: provider.description || '',
        icon: provider.icon || provider.lobeIcon || '',
        status: 1,
      });

      // 构建模型数据
      const modelEntries = Object.entries(provider.models || {}).sort(([a], [b]) =>
        a.localeCompare(b),
      );

      for (const [modelId, model] of modelEntries) {
        models.push({
          model_name: modelId,
          description: model.description || '',
          tags: this.buildModelTags(model),
          vendor_id: null, // 由导入器通过名称映射填充
          endpoints: null,
          status: 1,
          name_rule: 0,
          icon: model.icon || provider.icon || provider.lobeIcon || '',
        });
      }
    }

    return { vendors, models };
  }

  /** 构建 NewAPI 价格配置 */
  buildPriceConfig(allModelsData: NormalizedData): NewApiPriceConfig {
    const config: NewApiPriceConfig = {
      data: {
        cache_ratio: {},
        completion_ratio: {},
        model_ratio: {},
      },
      message: '',
      success: true,
    };

    for (const provider of Object.values(allModelsData.providers)) {
      for (const [modelId, model] of Object.entries(provider.models || {})) {
        const ratios = this.calculateRatios(model.cost);
        if (ratios) {
          config.data.model_ratio[modelId] = ratios.model;

          if (ratios.completion !== null) {
            config.data.completion_ratio[modelId] = ratios.completion;
          }

          if (ratios.cache !== null) {
            config.data.cache_ratio[modelId] = ratios.cache;
          }
        }
      }
    }

    return config;
  }
}
