import type {
  Model,
  ModelKey,
  NormalizedData,
  OverrideConfig,
  PolicyConfig,
  Provider,
  SourceData,
} from '../types/index.js';
import { deepMerge } from '../utils/object-utils.js';

/** 数据处理服务 */
export class DataProcessor {
  /** 创建模型键 */
  private createModelKey(providerId: string, modelId: string): ModelKey {
    return `${providerId}/${modelId}` as ModelKey;
  }

  /** 生成默认描述 */
  private generateDefaultDescription(modelName: string, providerId: string): string {
    return `${modelName} is an AI model provided by ${providerId}.`;
  }

  /** 检查是否允许自动更新 */
  shouldAutoUpdate(policy: PolicyConfig, providerId: string, modelId: string): boolean {
    const modelKey = this.createModelKey(providerId, modelId);
    const modelPolicy = policy.models?.[modelKey]?.auto;
    const providerPolicy = policy.providers?.[providerId]?.auto;

    // 优先级: 模型 > 提供商 > 默认(true)
    if (typeof modelPolicy === 'boolean') return modelPolicy;
    if (typeof providerPolicy === 'boolean') return providerPolicy;
    return true;
  }

  /** 应用覆写配置 */
  private applyOverrides<T>(entity: T, override?: Partial<T>): T {
    if (!override) return entity;
    return deepMerge(entity, override);
  }

  /** 处理单个模型数据 */
  private processModel(
    modelData: Model,
    modelId: string,
    providerId: string,
    overrides: OverrideConfig,
  ): Model {
    const modelKey = this.createModelKey(providerId, modelId);
    const processed = { ...modelData };

    // 确保每个模型都有描述
    if (!processed.description) {
      processed.description = this.generateDefaultDescription(
        processed.name || modelId,
        providerId,
      );
    }

    // 应用模型级覆写
    return this.applyOverrides(processed, overrides.models?.[modelKey]);
  }

  /** 处理单个提供商数据 */
  private processProvider(
    provider: Provider,
    providerId: string,
    overrides: OverrideConfig,
    sourceProviderIds: Set<string>,
  ): Provider {
    // 应用提供商级覆写
    let processed = this.applyOverrides(provider, overrides.providers?.[providerId]);

    // 添加图标URL（如果来自源数据）
    if (sourceProviderIds.has(providerId)) {
      processed = deepMerge(processed, {
        iconURL: `https://models.dev/logos/${providerId}.svg`,
      });
    }

    // 处理所有模型
    const processedModels: Record<string, Model> = {};
    for (const [modelId, modelData] of Object.entries(provider.models || {})) {
      processedModels[modelId] = this.processModel(modelData, modelId, providerId, overrides);
    }

    return {
      ...processed,
      models: processedModels,
    };
  }

  /** 将源数据转换为规范化格式 */
  mapSourceToNormalized(source: SourceData): NormalizedData {
    return { providers: source };
  }

  /** 注入手动添加的提供商 */
  injectManualProviders(normalized: NormalizedData, overrides: OverrideConfig): NormalizedData {
    const result = { ...normalized };

    for (const [providerId, providerOverride] of Object.entries(overrides.providers || {})) {
      if (!result.providers[providerId]) {
        const baseProvider: Provider = {
          id: providerId,
          models: {},
          ...providerOverride,
        };
        result.providers[providerId] = baseProvider;
      }
    }

    return result;
  }

  /** 处理所有数据 */
  processAllData(
    normalized: NormalizedData,
    overrides: OverrideConfig,
    sourceProviderIds: Set<string>,
  ): NormalizedData {
    const processed: Record<string, Provider> = {};

    for (const [providerId, provider] of Object.entries(normalized.providers)) {
      processed[providerId] = this.processProvider(
        provider,
        providerId,
        overrides,
        sourceProviderIds,
      );
    }

    return { providers: processed };
  }
}
