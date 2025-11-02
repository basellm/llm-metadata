import type {
  ModelCost,
  NewApiModel,
  NewApiPriceConfig,
  NewApiRatios,
  NewApiSyncPayload,
  NewApiVendor,
  NormalizedData,
} from '../types/index.js';
import { buildModelPriceInfo, buildModelTags, getMaxPrices } from '../utils/format-utils.js';

/** NewAPI 构建服务 */
export class NewApiBuilder {
  /** 计算 NewAPI 价格比率（使用分层定价中的最高价格） */
  private calculateRatios(cost?: ModelCost): NewApiRatios | null {
    const { maxInput, maxOutput, maxCacheRead } = getMaxPrices(cost);

    if (!maxInput) {
      return null;
    }

    const ratios: NewApiRatios = {
      model: maxInput / 2, // 基准: $2 per 1M tokens
      completion: null,
      cache: null,
    };

    if (maxOutput) {
      ratios.completion = maxOutput / maxInput;
    }

    if (maxCacheRead) {
      ratios.cache = maxCacheRead / maxInput;
    }

    return ratios;
  }

  /** 提取单位计费的最小价格（per_image、per_second、per_10k_chars 及其变体） */
  private getMinUnitPrice(cost?: ModelCost): number | null {
    if (!cost) return null;
    const entries = Object.entries(cost).filter(([, v]) => typeof v === 'number') as [
      string,
      number,
    ][];
    const unitPrices: number[] = [];
    for (const [key, value] of entries) {
      if (/^(per_image|per_second|per_10k_chars)(\b|_)/.test(key)) {
        if (value > 0) unitPrices.push(value);
      }
    }
    if (unitPrices.length === 0) return null;
    return Math.min(...unitPrices);
  }

  /** 计算每百万 tokens 的美元价格与倍率字段 */
  private buildPricingFields(cost?: ModelCost): {
    price_per_m_input: number | null;
    price_per_m_output: number | null;
    price_per_m_cache_read: number | null;
    price_per_m_cache_write: number | null;
    ratio_model: number | null;
    ratio_completion: number | null;
    ratio_cache: number | null;
  } {
    const { input, output, cacheRead, cacheWrite } = buildModelPriceInfo(cost);
    const ratios = this.calculateRatios(cost);

    return {
      price_per_m_input: input,
      price_per_m_output: output,
      price_per_m_cache_read: cacheRead,
      price_per_m_cache_write: cacheWrite,
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
        icon: provider.lobeIcon || '',
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
          icon: model.icon || provider.lobeIcon || '',
          price_per_m_input: pricing.price_per_m_input,
          price_per_m_output: pricing.price_per_m_output,
          price_per_m_cache_read: pricing.price_per_m_cache_read,
          price_per_m_cache_write: pricing.price_per_m_cache_write,
          ratio_model: pricing.ratio_model,
          ratio_completion: pricing.ratio_completion,
          ratio_cache: pricing.ratio_cache,
        });
      }
    }

    return { vendors, models };
  }

  /** 构建 NewAPI 价格配置（可选按提供商过滤） */
  buildPriceConfig(allModelsData: NormalizedData, providerId?: string): NewApiPriceConfig {
    const config: NewApiPriceConfig = {
      data: {
        cache_ratio: {},
        completion_ratio: {},
        model_ratio: {},
        model_price: {},
      },
      message: '',
      success: true,
    };

    const providers = providerId
      ? allModelsData.providers[providerId]
        ? [allModelsData.providers[providerId]]
        : []
      : Object.values(allModelsData.providers);

    for (const provider of providers) {
      for (const [modelId, model] of Object.entries(provider.models || {})) {
        const ratios = this.calculateRatios(model.cost);
        const minUnit = this.getMinUnitPrice(model.cost);

        if (minUnit !== null) {
          config.data.model_price[modelId] = minUnit;
        }

        if (ratios) {
          config.data.model_ratio[modelId] = ratios.model;

          if (ratios.completion !== null) {
            config.data.completion_ratio[modelId] = ratios.completion;
          }

          if (ratios.cache !== null) {
            config.data.cache_ratio[modelId] = ratios.cache;
          }
        } else if (minUnit !== null) {
          // 无 token 定价时，使用单位计费的最低价格作为倍率
          config.data.model_ratio[modelId] = minUnit;
        }
      }
    }

    return config;
  }
}
