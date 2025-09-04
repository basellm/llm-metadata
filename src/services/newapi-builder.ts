import type {
  ModelCost,
  NewApiModel,
  NewApiPriceConfig,
  NewApiRatios,
  NewApiSyncPayload,
  NewApiVendor,
  NormalizedData,
} from '../types/index.js';
import { buildModelPriceInfo, buildModelTags } from '../utils/format-utils.js';

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

  /** 计算每百万 tokens 的美元价格与倍率字段 */
  private buildPricingFields(cost?: ModelCost): {
    price_per_m_input: number | null;
    price_per_m_output: number | null;
    price_per_m_cache: number | null;
    ratio_model: number | null;
    ratio_completion: number | null;
    ratio_cache: number | null;
  } {
    const price = buildModelPriceInfo(cost)
    const ratios = this.calculateRatios(cost);

    return {
      price_per_m_input: price.input,
      price_per_m_output: price.output,
      price_per_m_cache: price.cache,
      ratio_model: ratios ? ratios.model : null,
      ratio_completion: ratios ? ratios.completion : null,
      ratio_cache: ratios ? ratios.cache : null,
    };
  }

  /** 构建 NewAPI 同步载荷 */
  buildSyncPayload(
    allModelsData: NormalizedData,
    tagMap?: Record<string, string>,
  ): NewApiSyncPayload {
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
        const pricing = this.buildPricingFields(model.cost);
        models.push({
          model_name: modelId,
          description: model.description || '',
          tags: buildModelTags(model, tagMap).join(','),
          vendor_name: provider.name || providerId,
          endpoints: null,
          status: 1,
          name_rule: 0,
          icon: model.icon || provider.icon || provider.lobeIcon || '',
          price_per_m_input: pricing.price_per_m_input,
          price_per_m_output: pricing.price_per_m_output,
          price_per_m_cache: pricing.price_per_m_cache,
          ratio_model: pricing.ratio_model,
          ratio_completion: pricing.ratio_completion,
          ratio_cache: pricing.ratio_cache,
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
