import type {
  I18nOverrideEntity,
  Model,
  ModelKey,
  NormalizedData,
  OverrideConfig,
  PolicyConfig,
  Provider,
  SourceData,
} from '../types/index.js';
import { I18nService } from './i18n-service.js';
import { deepMerge } from '../utils/object-utils.js';

/** 数据处理服务 */
export class DataProcessor {
  private readonly i18n: I18nService;
  constructor() {
    // 使用项目根默认：运行时由 build.ts 实例化 DataProcessor 后，不会传 root；
    // 这里在需要 API i18n 时，读取 "i18n/api/*.json" 的英文兜底模板。
    this.i18n = new I18nService(process.cwd());
  }
  /** 创建模型键 */
  private createModelKey(providerId: string, modelId: string): ModelKey {
    return `${providerId}/${modelId}` as ModelKey;
  }

  /** 生成默认描述 */
  private generateDefaultDescription(modelName: string, providerId: string): string {
    const apiMsg = this.i18n.getApiMessages('en');
    const tpl =
      apiMsg.defaults?.model_description ||
      '${modelName} is an AI model provided by ${providerId}.';
    return tpl.replace('${modelName}', modelName).replace('${providerId}', providerId);
  }

  /** 按 locale 生成默认描述（fallback 到英文模板） */
  private generateDefaultDescriptionForLocale(
    locale: string,
    modelName: string,
    providerId: string,
  ): string {
    const msg = this.i18n.getApiMessages(locale);
    const tpl =
      msg.defaults?.model_description ||
      this.i18n.getApiMessages('en').defaults?.model_description ||
      '${modelName} is an AI model provided by ${providerId}.';
    return tpl.replace('${modelName}', modelName).replace('${providerId}', providerId);
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
    let processed = { ...modelData };

    // 确保每个模型都有描述
    if (!processed.description) {
      processed.description = this.generateDefaultDescription(
        processed.name || modelId,
        providerId,
      );
    }

    // 应用模型级覆写
    processed = this.applyOverrides(processed, overrides.models?.[modelKey]);

    // 应用 i18n 文案（若存在，将默认英文写回 name/description；其它语言在 JSON i18n 时再切换）
    const i18nModel: I18nOverrideEntity | undefined = overrides.i18n?.models?.[modelKey];
    if (i18nModel) {
      if (i18nModel.name?.en) processed.name = i18nModel.name.en;
      if (i18nModel.description?.en) processed.description = i18nModel.description.en;
    }

    return processed;
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

  /** 根据 locale 应用 i18n 文案到标准化数据（返回深拷贝后的新对象） */
  localizeNormalizedData(
    data: NormalizedData,
    overrides: OverrideConfig,
    locale: string,
  ): NormalizedData {
    const localizedProviders: Record<string, Provider> = {};

    for (const [providerId, provider] of Object.entries(data.providers)) {
      const provI18n: I18nOverrideEntity | undefined = overrides.i18n?.providers?.[providerId];
      const name = provI18n?.name?.[locale] ?? provider.name;
      const description = provI18n?.description?.[locale] ?? provider.description;

      const localizedModels: Record<string, Model> = {};
      for (const [modelId, model] of Object.entries(provider.models || {})) {
        const key = this.createModelKey(providerId, modelId);
        const modI18n: I18nOverrideEntity | undefined = overrides.i18n?.models?.[key];
        const modelName = modI18n?.name?.[locale];
        const modelDesc = modI18n?.description?.[locale];
        const newModel: Model = { ...model };
        if (modelName !== undefined) newModel.name = modelName;
        if (modelDesc !== undefined) {
          newModel.description = modelDesc;
        } else {
          // 若原描述等于英文默认描述，则替换为对应语言模板
          const baseName = newModel.name || modelId;
          const enDefault = this.generateDefaultDescription(baseName, providerId);
          if (newModel.description === enDefault) {
            newModel.description = this.generateDefaultDescriptionForLocale(
              locale,
              baseName,
              providerId,
            );
          }
        }

        localizedModels[modelId] = newModel;
      }

      localizedProviders[providerId] = {
        ...provider,
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
        models: localizedModels,
      };
    }

    return { providers: localizedProviders };
  }
}
