import {
  ModelBase,
  ModelCapabilities,
  ModelLimits,
  ModelCost,
  ModelModalities,
  Model,
  ProviderBase,
  Provider,
  SourceData,
  PolicyConfig,
  OverrideConfig,
  I18nTextMap,
  I18nOverrideEntity,
  I18nLocaleConfig,
  I18nConfig,
  ApiI18nCapabilityLabels,
  ApiI18nDefaults,
  ApiI18nMessages,
  ProviderIndexItem,
  ModelIndexItem,
  IndexOutput,
  ProvidersOutput,
  NewApiVendor,
  NewApiModel,
  NewApiRatios,
  NewApiPriceConfig,
  NewApiSyncPayload,
  VoAPIFirm,
  BuildStats,
  BuildManifest,
  NormalizedData,
  BuildConfig,
  ModelKey,
} from './index.js';
import { describe, it, expect } from '@jest/globals';

describe('Type Definitions', () => {
  it('should properly define ModelBase interface', () => {
    const modelBase: ModelBase = {
      id: 'model-id',
      name: 'Test Model',
      description: 'A test model',
      tags: ['tag1', 'tag2'],
      icon: 'icon-url',
      release_date: '2023-01-01',
      last_updated: '2023-01-01',
      knowledge: 'knowledge-base',
      open_weights: true,
    };

    expect(modelBase.id).toBe('model-id');
    expect(modelBase.name).toBe('Test Model');
  });

  it('should properly define ModelCapabilities interface', () => {
    const capabilities: ModelCapabilities = {
      attachment: true,
      reasoning: false,
      tool_call: true,
      temperature: false,
    };

    expect(capabilities.attachment).toBe(true);
    expect(capabilities.reasoning).toBe(false);
  });

  it('should properly define ModelLimits interface', () => {
    const limits: ModelLimits = {
      context: 4096,
      output: 2048,
    };

    expect(limits.context).toBe(4096);
    expect(limits.output).toBe(2048);
  });

  it('should properly define ModelCost interface with all possible fields', () => {
    const cost: ModelCost = {
      currency: 'USD',
      input: 0.01,
      output: 0.02,
      cache_read: 0.005,
      cache_write: 0.003,
      text_input: 0.01,
      vision_input: 0.02,
      audio_input: 0.03,
      multi_output: 0.04,
      multiin_text_output: 0.05,
      purein_text_output: 0.06,
      text: 0.01,
      vl: 0.02,
      embedding_text: 0.001,
      embedding_image: 0.002,
      per_second: 0.1,
      per_10k_chars: 0.5,
      per_image: 0.05,
      input_32k_128k: 0.03, // dynamic field
    };

    expect(cost.currency).toBe('USD');
    expect(cost.input).toBe(0.01);
    expect(cost.output).toBe(0.02);
    expect(cost['input_32k_128k']).toBe(0.03); // testing dynamic field access
  });

  it('should properly define ModelModalities interface', () => {
    const modalities: ModelModalities = {
      input: ['text', 'image'],
      output: ['text', 'audio'],
    };

    expect(modalities.input).toEqual(['text', 'image']);
    expect(modalities.output).toEqual(['text', 'audio']);
  });

  it('should properly define Model interface extending ModelBase and ModelCapabilities', () => {
    const model: Model = {
      id: 'model-id',
      name: 'Test Model',
      attachment: true,
      reasoning: false,
      limit: {
        context: 4096,
        output: 2048,
      },
      cost: {
        input: 0.01,
        output: 0.02,
      },
      modalities: {
        input: ['text'],
        output: ['text'],
      },
    };

    expect(model.id).toBe('model-id');
    expect(model.name).toBe('Test Model');
    expect(model.attachment).toBe(true);
    expect(model.reasoning).toBe(false);
    expect(model.limit?.context).toBe(4096);
    expect(model.cost?.input).toBe(0.01);
  });

  it('should properly define ProviderBase interface', () => {
    const providerBase: ProviderBase = {
      id: 'provider-id',
      name: 'Test Provider',
      description: 'A test provider',
      api: 'https://api.example.com',
      doc: 'https://docs.example.com',
      icon: 'icon-url',
      iconURL: 'icon-url-full',
      lobeIcon: 'lobe-icon',
    };

    expect(providerBase.id).toBe('provider-id');
    expect(providerBase.name).toBe('Test Provider');
  });

  it('should properly define Provider interface', () => {
    const provider: Provider = {
      id: 'provider-id',
      name: 'Test Provider',
      models: {
        'model-1': {
          id: 'model-1',
          name: 'Model 1',
        },
      },
    };

    expect(provider.id).toBe('provider-id');
    expect(provider.models['model-1'].id).toBe('model-1');
    expect(provider.models['model-1'].name).toBe('Model 1');
  });

  it('should properly define SourceData type', () => {
    const sourceData: SourceData = {
      'provider-1': {
        id: 'provider-1',
        name: 'Provider 1',
        models: {
          'model-1': {
            id: 'model-1',
            name: 'Model 1',
          },
        },
      },
    };

    expect(sourceData['provider-1'].id).toBe('provider-1');
    expect(sourceData['provider-1'].models['model-1'].id).toBe('model-1');
  });

  it('should properly define PolicyConfig interface', () => {
    const policyConfig: PolicyConfig = {
      providers: {
        'provider-1': { auto: true },
      },
      models: {
        'model-1': { auto: false },
      },
    };

    expect(policyConfig.providers?.['provider-1']?.auto).toBe(true);
    expect(policyConfig.models?.['model-1']?.auto).toBe(false);
  });

  it('should properly define OverrideConfig interface', () => {
    const overrideConfig: OverrideConfig = {
      providers: {
        'provider-1': {
          name: 'New Provider Name',
          description: 'New Description',
        },
      },
      models: {
        'model-1': {
          name: 'New Model Name',
        },
      },
      i18n: {
        providers: {
          'provider-1': {
            name: { en: 'English Name', zh: '中文名称' },
          },
        },
        models: {
          'provider/model': {
            name: { en: 'English Name', zh: '中文名称' },
          },
        },
      },
    };

    expect(overrideConfig.providers?.['provider-1']?.name).toBe('New Provider Name');
    expect(overrideConfig.i18n?.providers?.['provider-1']?.name?.en).toBe('English Name');
    expect(overrideConfig.i18n?.models?.['provider/model']?.name?.en).toBe('English Name');
  });

  it('should properly define I18nTextMap interface', () => {
    const i18nTextMap: I18nTextMap = {
      en: 'English text',
      zh: '中文文本',
      ja: '日本語テキスト',
    };

    expect(i18nTextMap.en).toBe('English text');
    expect(i18nTextMap.zh).toBe('中文文本');
  });

  it('should properly define I18nOverrideEntity interface', () => {
    const i18nOverride: I18nOverrideEntity = {
      name: { en: 'English Name', zh: '中文名称' },
      description: { en: 'English Description', zh: '中文描述' },
    };

    expect(i18nOverride.name?.en).toBe('English Name');
    expect(i18nOverride.description?.zh).toBe('中文描述');
  });

  it('should properly define I18nLocaleConfig interface', () => {
    const localeConfig: I18nLocaleConfig = {
      locale: 'en-US',
      name: 'English (US)',
      default: true,
      site_name: 'My Site',
      timeZone: 'America/New_York',
    };

    expect(localeConfig.locale).toBe('en-US');
    expect(localeConfig.default).toBe(true);
  });

  it('should properly define I18nConfig interface', () => {
    const i18nConfig: I18nConfig = {
      locales: [
        {
          locale: 'en-US',
          name: 'English (US)',
          default: true,
        },
        {
          locale: 'zh-CN',
          name: '简体中文',
        },
      ],
    };

    expect(i18nConfig.locales.length).toBe(2);
    expect(i18nConfig.locales[0].locale).toBe('en-US');
  });

  it('should properly define ApiI18nCapabilityLabels interface', () => {
    const capabilityLabels: ApiI18nCapabilityLabels = {
      tools: 'Tools',
      files: 'Files',
      reasoning: 'Reasoning',
      temperature: 'Temperature',
    };

    expect(capabilityLabels.tools).toBe('Tools');
    expect(capabilityLabels.files).toBe('Files');
  });

  it('should properly define ApiI18nDefaults interface', () => {
    const defaults: ApiI18nDefaults = {
      'model_description': '${modelName} is an AI model provided by ${providerId}.',
    };

    expect(defaults.model_description).toBe('${modelName} is an AI model provided by ${providerId}.');
  });

  it('should properly define ApiI18nMessages interface', () => {
    const messages: ApiI18nMessages = {
      capability_labels: {
        tools: 'Tools',
        files: 'Files',
      },
      defaults: {
        'model_description': '${modelName} is an AI model provided by ${providerId}.',
      },
    };

    expect(messages.capability_labels?.tools).toBe('Tools');
    expect(messages.defaults?.model_description).toBe('${modelName} is an AI model provided by ${providerId}.');
  });

  it('should properly define ProviderIndexItem interface', () => {
    const providerIndexItem: ProviderIndexItem = {
      id: 'provider-id',
      name: 'Provider Name',
      api: 'https://api.example.com',
      doc: 'https://docs.example.com',
      icon: 'icon-url',
      iconURL: 'full-icon-url',
      lobeIcon: 'lobe-icon',
      modelCount: 5,
    };

    expect(providerIndexItem.id).toBe('provider-id');
    expect(providerIndexItem.modelCount).toBe(5);
  });

  it('should properly define ModelIndexItem interface', () => {
    const modelIndexItem: ModelIndexItem = {
      id: 'model-id',
      providerId: 'provider-id',
      name: 'Model Name',
      updated: '2023-01-01',
      flags: {
        attachment: true,
        reasoning: false,
        tool_call: true,
      },
    };

    expect(modelIndexItem.id).toBe('model-id');
    expect(modelIndexItem.flags.attachment).toBe(true);
    expect(modelIndexItem.flags.reasoning).toBe(false);
  });

  it('should properly define IndexOutput interface', () => {
    const indexOutput: IndexOutput = {
      providers: [
        {
          id: 'provider-id',
          name: 'Provider Name',
          modelCount: 1,
        },
      ],
      models: [
        {
          id: 'model-id',
          providerId: 'provider-id',
          name: 'Model Name',
          flags: {
            attachment: true,
            reasoning: false,
            tool_call: true,
          },
        },
      ],
    };

    expect(indexOutput.providers.length).toBe(1);
    expect(indexOutput.models.length).toBe(1);
  });

  it('should properly define ProvidersOutput interface', () => {
    const providersOutput: ProvidersOutput = {
      providers: [
        {
          id: 'provider-id',
          name: 'Provider Name',
          modelCount: 1,
        },
      ],
    };

    expect(providersOutput.providers.length).toBe(1);
    expect(providersOutput.providers[0].id).toBe('provider-id');
  });

  it('should properly define NewApiVendor interface', () => {
    const vendor: NewApiVendor = {
      name: 'Vendor Name',
      description: 'Vendor Description',
      icon: 'vendor-icon',
      status: 1,
    };

    expect(vendor.name).toBe('Vendor Name');
    expect(vendor.status).toBe(1);
  });

  it('should properly define NewApiModel interface', () => {
    const newApiModel: NewApiModel = {
      model_name: 'Model Name',
      description: 'Model Description',
      tags: 'tag1,tag2',
      vendor_name: 'Vendor Name',
      endpoints: null,
      status: 1,
      name_rule: 1,
      icon: 'model-icon',
      price_per_m_input: 0.01,
      price_per_m_output: 0.02,
      ratio_model: 1.0,
      ratio_completion: 1.5,
    };

    expect(newApiModel.model_name).toBe('Model Name');
    expect(newApiModel.price_per_m_input).toBe(0.01);
  });

  it('should properly define NewApiRatios interface', () => {
    const ratios: NewApiRatios = {
      model: 1.0,
      completion: 1.5,
      cache: 0.5,
    };

    expect(ratios.model).toBe(1.0);
    expect(ratios.completion).toBe(1.5);
  });

  it('should properly define NewApiPriceConfig interface', () => {
    const priceConfig: NewApiPriceConfig = {
      data: {
        cache_ratio: { 'cache-type-1': 0.5 },
        completion_ratio: { 'completion-type-1': 1.0 },
        model_ratio: { 'model-type-1': 1.2 },
        model_price: { 'model-1': 0.01 },
      },
      message: 'Success',
      success: true,
    };

    expect(priceConfig.success).toBe(true);
    expect(priceConfig.data.cache_ratio['cache-type-1']).toBe(0.5);
  });

  it('should properly define NewApiSyncPayload interface', () => {
    const payload: NewApiSyncPayload = {
      vendors: [
        {
          name: 'Vendor Name',
          description: 'Vendor Description',
          icon: 'vendor-icon',
          status: 1,
        },
      ],
      models: [
        {
          model_name: 'Model Name',
          description: 'Model Description',
          tags: 'tags',
          vendor_name: 'Vendor Name',
          endpoints: null,
          status: 1,
          name_rule: 1,
          icon: 'model-icon',
        },
      ],
    };

    expect(payload.vendors.length).toBe(1);
    expect(payload.models.length).toBe(1);
  });

  it('should properly define VoAPIFirm interface', () => {
    const firm: VoAPIFirm = {
      id: 'firm-id',
      name: 'Firm Name',
      description: 'Firm Description',
      icon: 'firm-icon',
      status: 1,
      modelCount: 5,
      api: 'https://api.example.com',
      doc: 'https://docs.example.com',
    };

    expect(firm.id).toBe('firm-id');
    expect(firm.modelCount).toBe(5);
  });

  it('should properly define BuildStats interface', () => {
    const buildStats: BuildStats = {
      providers: 10,
      models: 100,
      filesChanged: 5,
      dryRun: false,
    };

    expect(buildStats.providers).toBe(10);
    expect(buildStats.dryRun).toBe(false);
  });

  it('should properly define BuildManifest interface', () => {
    const buildManifest: BuildManifest = {
      version: 1,
      generatedAt: '2023-01-01T00:00:00Z',
      sourceHash: 'source-hash',
      overridesHash: 'overrides-hash',
      policyHash: 'policy-hash',
      stats: {
        providers: 10,
        models: 100,
        filesChanged: 5,
        dryRun: false,
      },
      warnings: ['warning1', 'warning2'],
    };

    expect(buildManifest.version).toBe(1);
    expect(buildManifest.stats.providers).toBe(10);
    expect(buildManifest.warnings?.length).toBe(2);
  });

  it('should properly define NormalizedData interface', () => {
    const normalizedData: NormalizedData = {
      providers: {
        'provider-1': {
          id: 'provider-1',
          name: 'Provider Name',
          models: {},
        },
      },
    };

    expect(normalizedData.providers['provider-1']?.id).toBe('provider-1');
  });

  it('should properly define BuildConfig interface', () => {
    const buildConfig: BuildConfig = {
      dryRun: true,
      force: false,
      docsMdOnly: false,
      apiOnly: true,
    };

    expect(buildConfig.dryRun).toBe(true);
    expect(buildConfig.apiOnly).toBe(true);
  });

  it('should properly define ModelKey type', () => {
    const modelKey1: ModelKey = 'provider/model';
    const modelKey2: ModelKey = 'openai/gpt-4';

    expect(modelKey1).toBe('provider/model');
    expect(modelKey2).toBe('openai/gpt-4');
  });
});