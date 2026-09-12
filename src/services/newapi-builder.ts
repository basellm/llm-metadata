import type {
  ModelCost,
  NewApiModel,
  NewApiPriceConfig,
  NewApiPricingOptions,
  NewApiSyncPayload,
  NewApiVendor,
  NormalizedData,
} from '../types/index.js';
import { buildBillingExpr } from '../utils/billing-expr.js';
import { buildModelTags, normalizeCostToUSD } from '../utils/format-utils.js';

/** NewAPI 价格配置构建结果 */
export interface NewApiPriceConfigResult {
  config: NewApiPriceConfig;
  warnings: string[];
}

/**
 * NewAPI 构建服务。
 * vendors/models 只承载元数据；价格全部以 ratio_config 中的 tiered_expr 表达式表达。
 */
export class NewApiBuilder {
  constructor(private readonly pricing: NewApiPricingOptions) {}

  /** 供应商优先级（同名模型冲突时数值大者胜出） */
  private priorityOf(providerId: string): number {
    return this.pricing.providers[providerId]?.priority ?? 0;
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

  /**
   * 构建 NewAPI 元数据同步载荷。
   * 同名模型跨供应商时按优先级归属唯一供应商，无模型的供应商不输出。
   */
  buildSyncPayload(
    allModelsData: NormalizedData,
    tagMap?: Record<string, string>,
  ): NewApiSyncPayload {
    const models: NewApiModel[] = [];
    const claimedModels = new Set<string>();
    const vendorsWithModels = new Set<string>();

    for (const providerId of this.sortProviderIds(Object.keys(allModelsData.providers))) {
      const provider = allModelsData.providers[providerId];
      for (const [modelId, model] of Object.entries(provider.models || {})) {
        if (claimedModels.has(modelId)) continue;
        claimedModels.add(modelId);
        vendorsWithModels.add(providerId);

        models.push({
          model_name: modelId,
          description: model.description || '',
          tags: buildModelTags(model, tagMap).join(','),
          vendor_name: provider.name || providerId,
          endpoints: null,
          status: 1,
          name_rule: 0,
          icon: model.icon || provider.lobeIcon || '',
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

    return { vendors, models };
  }

  /** 构建 NewAPI 价格配置（可选按提供商过滤）：每个可定价模型一条 tiered_expr 表达式 */
  buildPriceConfig(allModelsData: NormalizedData, providerId?: string): NewApiPriceConfigResult {
    const config: NewApiPriceConfig = {
      data: { billing_mode: {}, billing_expr: {} },
      message: '',
      success: true,
    };

    const providerIds = providerId
      ? allModelsData.providers[providerId]
        ? [providerId]
        : []
      : this.sortProviderIds(Object.keys(allModelsData.providers));

    const skipped = new Map<string, number>();
    const warnings: string[] = [];
    const claimedModels = new Set<string>();

    for (const id of providerIds) {
      const provider = allModelsData.providers[id];
      const rule = this.pricing.providers[id] ?? {};

      for (const [modelId, model] of Object.entries(provider.models || {})) {
        if (claimedModels.has(modelId)) continue;

        const usdCost = this.toUsdCost(model.cost, id, skipped);
        if (!usdCost) continue;

        const result = buildBillingExpr(usdCost, rule);
        warnings.push(...result.warnings.map((w) => `newapi: ${id}/${modelId}: ${w}`));
        if (result.expr === null) continue;

        claimedModels.add(modelId);
        config.data.billing_mode[modelId] = 'tiered_expr';
        config.data.billing_expr[modelId] = result.expr;
      }
    }

    return { config, warnings: [...this.collectCurrencyWarnings(skipped), ...warnings] };
  }
}
