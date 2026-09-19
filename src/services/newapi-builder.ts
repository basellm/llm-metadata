import type { NewApiDeployment } from '../billing/deployment.js';
import {
  buildRatioConfig,
  sortByPriority,
  type RatioConfigProvider,
  type RatioConfigResult,
} from '../billing/ratio-config.js';
import type {
  NewApiModel,
  NewApiSyncPayload,
  NewApiVendor,
  NormalizedData,
  Provider,
} from '../types/index.js';
import { buildModelTags } from '../utils/format-utils.js';

/**
 * NewAPI 构建服务。
 * vendors/models 只承载元数据；价格全部以 ratio_config 中的 tiered_expr 表达式表达，
 * 表达式生成委托给与 Web UI 共用的 src/billing 核心（静态预设按默认部署生成）。
 */
export class NewApiBuilder {
  constructor(
    private readonly deployment: NewApiDeployment,
    private readonly exchangeRates: Readonly<Record<string, number>>,
  ) {}

  private static asRatioConfigProvider(provider: Provider): RatioConfigProvider {
    return {
      id: provider.id,
      models: provider.models || {},
      ...(provider.billing ? { billing: provider.billing } : {}),
    };
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

    const ordered = sortByPriority(
      Object.values(allModelsData.providers).map(NewApiBuilder.asRatioConfigProvider),
    );
    for (const { id: providerId } of ordered) {
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
  buildPriceConfig(allModelsData: NormalizedData, providerId?: string): RatioConfigResult {
    const providers = providerId
      ? allModelsData.providers[providerId]
        ? [allModelsData.providers[providerId]]
        : []
      : Object.values(allModelsData.providers);
    return buildRatioConfig(
      providers.map(NewApiBuilder.asRatioConfigProvider),
      this.deployment,
      this.exchangeRates,
    );
  }
}
