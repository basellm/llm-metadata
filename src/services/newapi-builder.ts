import type {
  ModelCost,
  NewApiModel,
  NewApiPriceConfig,
  NewApiPricingOptions,
  NewApiRatios,
  NewApiSyncPayload,
  NewApiVendor,
  NormalizedData,
} from '../types/index.js';
import { buildTieredBillingExpr } from '../utils/billing-expr.js';
import {
  buildModelPriceInfo,
  buildModelTags,
  getMaxPrices,
  normalizeCostToUSD,
} from '../utils/format-utils.js';

/** NewAPI 同步载荷构建结果 */
export interface NewApiSyncResult extends NewApiSyncPayload {
  warnings: string[];
}

/** NewAPI 价格配置构建结果 */
export interface NewApiPriceConfigResult {
  config: NewApiPriceConfig;
  warnings: string[];
}

/** NewAPI 构建服务 */
export class NewApiBuilder {
  constructor(private readonly pricing: NewApiPricingOptions) {}

  /** 供应商优先级（同名模型冲突时数值大者胜出） */
  private priorityOf(providerId: string): number {
    return this.pricing.providerPriority[providerId] ?? 0;
  }

  /** 按优先级降序、ID 升序排列供应商，保证冲突解析的确定性 */
  private sortProviderIds(providerIds: string[]): string[] {
    return [...providerIds].sort(
      (a, b) => this.priorityOf(b) - this.priorityOf(a) || a.localeCompare(b),
    );
  }

  /** 将成本换算为 USD；无法换算时记录聚合警告并返回 undefined */
  private toUsdCost(
    cost: ModelCost | undefined,
    providerId: string,
    skipped: Map<string, number>,
  ): ModelCost | undefined {
    const result = normalizeCostToUSD(cost, this.pricing.exchangeRates);
    if (result.unknownCurrency) {
      const key = `${providerId}\u0000${result.unknownCurrency}`;
      skipped.set(key, (skipped.get(key) || 0) + 1);
      return undefined;
    }
    return result.cost;
  }

  /** 汇总货币换算失败的警告 */
  private collectCurrencyWarnings(skipped: Map<string, number>): string[] {
    return [...skipped.entries()].map(([key, count]) => {
      const [providerId, currency] = key.split('\u0000');
      return `newapi: skipped pricing for ${count} model(s) from "${providerId}" (no exchange rate for ${currency})`;
    });
  }

  /** 计算 NewAPI 价格比率（使用分层定价中的最高价格，成本须为 USD） */
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

  /** 计算每百万 tokens 的美元价格与倍率字段（成本须为 USD） */
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

  /**
   * 构建 NewAPI 同步载荷。
   * 同名模型跨供应商时按优先级归属唯一供应商，无模型的供应商不输出。
   */
  buildSyncPayload(
    allModelsData: NormalizedData,
    tagMap?: Record<string, string>,
  ): NewApiSyncResult {
    const models: NewApiModel[] = [];
    const skipped = new Map<string, number>();
    const claimedModels = new Set<string>();
    const vendorsWithModels = new Set<string>();

    const providerIds = this.sortProviderIds(Object.keys(allModelsData.providers));

    for (const providerId of providerIds) {
      const provider = allModelsData.providers[providerId];
      const modelEntries = Object.entries(provider.models || {}).sort(([a], [b]) =>
        a.localeCompare(b),
      );

      for (const [modelId, model] of modelEntries) {
        if (claimedModels.has(modelId)) continue;
        claimedModels.add(modelId);
        vendorsWithModels.add(providerId);

        const usdCost = this.toUsdCost(model.cost, providerId, skipped);
        const pricing = this.buildPricingFields(usdCost);
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

    const vendors: NewApiVendor[] = [...vendorsWithModels]
      .sort((a, b) => a.localeCompare(b))
      .map((providerId) => {
        const provider = allModelsData.providers[providerId];
        return {
          name: provider.name || providerId,
          description: provider.description || '',
          icon: provider.lobeIcon || '',
          status: 1,
        };
      });

    models.sort((a, b) => a.model_name.localeCompare(b.model_name));

    return { vendors, models, warnings: this.collectCurrencyWarnings(skipped) };
  }

  /** 构建 NewAPI 价格配置（可选按提供商过滤） */
  buildPriceConfig(allModelsData: NormalizedData, providerId?: string): NewApiPriceConfigResult {
    const config: NewApiPriceConfig = {
      data: {
        cache_ratio: {},
        completion_ratio: {},
        model_ratio: {},
        model_price: {},
        billing_mode: {},
        billing_expr: {},
      },
      message: '',
      success: true,
    };

    const providerIds = providerId
      ? allModelsData.providers[providerId]
        ? [providerId]
        : []
      : this.sortProviderIds(Object.keys(allModelsData.providers));

    const skipped = new Map<string, number>();
    const claimedModels = new Set<string>();

    for (const id of providerIds) {
      const provider = allModelsData.providers[id];
      for (const [modelId, model] of Object.entries(provider.models || {})) {
        if (claimedModels.has(modelId)) continue;

        const usdCost = this.toUsdCost(model.cost, id, skipped);
        if (!usdCost) continue;

        const minUnit = this.getMinUnitPrice(usdCost);
        if (minUnit !== null) {
          // 单位计费模型：只输出 model_price，且不输出任何 ratio 字段
          claimedModels.add(modelId);
          config.data.model_price[modelId] = minUnit;
          continue;
        }

        // 分层/思考差价模型：输出表达式计费（new-api 优先采用；倍率仍作回退）
        const billingExpr = buildTieredBillingExpr(usdCost);
        const ratios = this.calculateRatios(usdCost);
        if (!billingExpr && !ratios) continue;

        claimedModels.add(modelId);

        if (billingExpr) {
          config.data.billing_mode[modelId] = 'tiered_expr';
          config.data.billing_expr[modelId] = billingExpr;
        }

        // 非单位计费模型：按 token 定价计算比率
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

    return { config, warnings: this.collectCurrencyWarnings(skipped) };
  }
}
