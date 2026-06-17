import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import type {
  SourceData,
  NormalizedData,
  PolicyConfig,
  OverrideConfig,
  Model,
  Provider,
} from '../types/index.js';
import { DataProcessor } from './data-processor.js';

// Mock the I18nService to prevent file system access during tests
jest.mock('./i18n-service.js', () => ({
  I18nService: jest.fn().mockImplementation(() => ({
    getApiMessages: (locale: string) => {
      if (locale === 'en') {
        return {
          defaults: {
            model_description: '${modelName} is an AI model provided by ${providerId}.',
          },
          capability_labels: {
            tools: 'Tools',
            files: 'Files',
            reasoning: 'Reasoning',
            temperature: 'Temperature',
          },
        };
      } else if (locale === 'zh-CN') {
        return {
          defaults: {
            model_description: '${modelName} 是由 ${providerId} 提供的人工智能模型。',
          },
          capability_labels: {
            tools: '工具',
            files: '文件',
            reasoning: '推理',
            temperature: '温度',
          },
        };
      }
      return {
        defaults: {
          model_description: '${modelName} is an AI model provided by ${providerId}.',
        },
      };
    },
  })),
}));

describe('DataProcessor', () => {
  let dataProcessor: DataProcessor;

  beforeEach(() => {
    dataProcessor = new DataProcessor();
  });

  describe('createModelKey', () => {
    it('should create a proper model key from providerId and modelId', () => {
      const result = (dataProcessor as any).createModelKey('openai', 'gpt-4');
      expect(result).toBe('openai/gpt-4');
    });

    it('should handle special characters in providerId and modelId', () => {
      const result = (dataProcessor as any).createModelKey('test-provider', 'model-with-dashes');
      expect(result).toBe('test-provider/model-with-dashes');
    });
  });

  describe('generateDefaultDescription', () => {
    it('should generate default description with model name and provider ID', () => {
      const result = (dataProcessor as any).generateDefaultDescription('GPT-4', 'openai');
      expect(result).toBe('GPT-4 is an AI model provided by openai.');
    });

    it('should handle model IDs when no name is provided', () => {
      const result = (dataProcessor as any).generateDefaultDescription('gpt-4', 'openai');
      expect(result).toBe('gpt-4 is an AI model provided by openai.');
    });
  });

  describe('generateDefaultDescriptionForLocale', () => {
    it('should generate default description for English locale', () => {
      const result = (dataProcessor as any).generateDefaultDescriptionForLocale(
        'en',
        'GPT-4',
        'openai',
      );
      expect(result).toBe('GPT-4 is an AI model provided by openai.');
    });

    it('should generate default description for Chinese locale', () => {
      const result = (dataProcessor as any).generateDefaultDescriptionForLocale(
        'zh-CN',
        'GPT-4',
        'openai',
      );
      expect(result).toBe('GPT-4 是由 openai 提供的人工智能模型。');
    });
  });

  describe('shouldAutoUpdate', () => {
    it('should return true by default', () => {
      const policy: PolicyConfig = {};
      const result = dataProcessor.shouldAutoUpdate(policy, 'openai', 'gpt-4');
      expect(result).toBe(true);
    });

    it('should return model policy when specified', () => {
      const policy: PolicyConfig = {
        models: {
          'openai/gpt-4': { auto: false },
        },
      };
      const result = dataProcessor.shouldAutoUpdate(policy, 'openai', 'gpt-4');
      expect(result).toBe(false);
    });

    it('should return provider policy when model policy is not specified', () => {
      const policy: PolicyConfig = {
        providers: {
          'openai': { auto: false },
        },
      };
      const result = dataProcessor.shouldAutoUpdate(policy, 'openai', 'gpt-4');
      expect(result).toBe(false);
    });

    it('should prioritize model policy over provider policy', () => {
      const policy: PolicyConfig = {
        models: {
          'openai/gpt-4': { auto: true }, // model takes precedence
        },
        providers: {
          'openai': { auto: false },
        },
      };
      const result = dataProcessor.shouldAutoUpdate(policy, 'openai', 'gpt-4');
      expect(result).toBe(true);
    });
  });

  describe('applyOverrides', () => {
    it('should return the original entity if no override is provided', () => {
      const entity = { name: 'Test Model', id: 'test' };
      const result = (dataProcessor as any).applyOverrides(entity, undefined);
      expect(result).toEqual(entity);
    });

    it('should merge entity with overrides', () => {
      const entity = { name: 'Original Name', description: 'Original Description' };
      const override = { name: 'New Name' };
      const result = (dataProcessor as any).applyOverrides(entity, override);
      expect(result).toEqual({
        name: 'New Name',
        description: 'Original Description',
      });
    });

    it('should deeply merge nested properties', () => {
      const entity = {
        name: 'Test',
        capabilities: { tool_call: true, reasoning: false },
      };
      const override = {
        capabilities: { reasoning: true, temperature: true },
      };
      const result = (dataProcessor as any).applyOverrides(entity, override);
      expect(result).toEqual({
        name: 'Test',
        capabilities: { tool_call: true, reasoning: true, temperature: true },
      });
    });
  });

  describe('processModel', () => {
    it('should add default description if none exists', () => {
      const modelData: Model = {
        id: 'gpt-4',
        name: 'GPT-4',
      };
      const overrides: OverrideConfig = {};
      const result = (dataProcessor as any).processModel(modelData, 'gpt-4', 'openai', overrides);
      expect(result.description).toBe('GPT-4 is an AI model provided by openai.');
    });

    it('should preserve existing description', () => {
      const modelData: Model = {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Custom description',
      };
      const overrides: OverrideConfig = {};
      const result = (dataProcessor as any).processModel(modelData, 'gpt-4', 'openai', overrides);
      expect(result.description).toBe('Custom description');
    });

    it('should apply model overrides', () => {
      const modelData: Model = {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Original description',
      };
      const overrides: OverrideConfig = {
        models: {
          'openai/gpt-4': {
            name: 'Updated GPT-4',
          },
        },
      };
      const result = (dataProcessor as any).processModel(modelData, 'gpt-4', 'openai', overrides);
      expect(result.name).toBe('Updated GPT-4');
      expect(result.description).toBe('Original description');
    });

    it('should apply i18n overrides', () => {
      const modelData: Model = {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Original description',
      };
      const overrides: OverrideConfig = {
        i18n: {
          models: {
            'openai/gpt-4': {
              name: { en: 'English GPT-4' },
              description: { en: 'English description' },
            },
          },
        },
      };
      const result = (dataProcessor as any).processModel(modelData, 'gpt-4', 'openai', overrides);
      expect(result.name).toBe('English GPT-4');
      expect(result.description).toBe('English description');
    });
  });

  describe('processProvider', () => {
    it('should apply provider overrides', () => {
      const providerData: Provider = {
        id: 'openai',
        models: {},
      };
      const overrides: OverrideConfig = {
        providers: {
          'openai': {
            name: 'OpenAI Updated',
          },
        },
      };
      const sourceProviderIds = new Set<string>();
      const result = (dataProcessor as any).processProvider(
        providerData,
        'openai',
        overrides,
        sourceProviderIds,
      );
      expect(result.name).toBe('OpenAI Updated');
    });

    it('should add iconURL if provider is in sourceProviderIds', () => {
      const providerData: Provider = {
        id: 'openai',
        models: {},
      };
      const overrides: OverrideConfig = {};
      const sourceProviderIds = new Set(['openai']);
      const result = (dataProcessor as any).processProvider(
        providerData,
        'openai',
        overrides,
        sourceProviderIds,
      );
      expect(result.iconURL).toBe('https://models.dev/logos/openai.svg');
    });

    it('should process all models within provider', () => {
      const providerData: Provider = {
        id: 'openai',
        models: {
          'gpt-4': {
            id: 'gpt-4',
            name: 'GPT-4',
          },
        },
      };
      const overrides: OverrideConfig = {
        models: {
          'openai/gpt-4': {
            name: 'Updated GPT-4',
          },
        },
      };
      const sourceProviderIds = new Set<string>();
      const result = (dataProcessor as any).processProvider(
        providerData,
        'openai',
        overrides,
        sourceProviderIds,
      );
      expect(result.models['gpt-4'].name).toBe('Updated GPT-4');
    });

    it('should inject models only defined in overrides', () => {
      const providerData: Provider = {
        id: 'openai',
        models: {},
      };
      const overrides: OverrideConfig = {
        models: {
          'openai/new-model': {
            id: 'new-model',
            name: 'New Model',
            description: 'New model description',
          },
        },
      };
      const sourceProviderIds = new Set<string>();
      const result = (dataProcessor as any).processProvider(
        providerData,
        'openai',
        overrides,
        sourceProviderIds,
      );
      expect(result.models['new-model']).toBeDefined();
      expect(result.models['new-model'].name).toBe('New Model');
    });
  });

  describe('mapSourceToNormalized', () => {
    it('should convert source data to normalized format', () => {
      const sourceData: SourceData = {
        'openai': {
          id: 'openai',
          name: 'OpenAI',
          models: {
            'gpt-4': {
              id: 'gpt-4',
              name: 'GPT-4',
            },
          },
        },
      };
      const result = dataProcessor.mapSourceToNormalized(sourceData);
      expect(result).toEqual({
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
              },
            },
          },
        },
      });
    });
  });

  describe('injectManualProviders', () => {
    it('should inject providers that exist only in overrides', () => {
      const normalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {},
          },
        },
      };
      const overrides: OverrideConfig = {
        providers: {
          'anthropic': {
            name: 'Anthropic',
            id: 'anthropic',
          },
        },
      };
      const result = dataProcessor.injectManualProviders(normalizedData, overrides);
      expect(result.providers['anthropic']).toBeDefined();
      expect(result.providers['anthropic'].name).toBe('Anthropic');
    });

    it('should not modify existing providers, only inject new ones', () => {
      const normalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {},
          },
        },
      };
      const overrides: OverrideConfig = {
        providers: {
          'openai': {
            name: 'OpenAI Updated',
          },
        },
      };
      const result = dataProcessor.injectManualProviders(normalizedData, overrides);
      // The injectManualProviders method only adds NEW providers, doesn't modify existing ones
      expect(result.providers['openai'].name).toBe('OpenAI'); // Original name preserved
    });

    it('should create placeholder provider for models referenced in overrides', () => {
      const normalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {},
          },
        },
      };
      const overrides: OverrideConfig = {
        models: {
          'anthropic/claude': {
            id: 'claude',
            name: 'Claude',
          },
        },
      };
      const result = dataProcessor.injectManualProviders(normalizedData, overrides);
      expect(result.providers['anthropic']).toBeDefined();
      expect(result.providers['anthropic'].id).toBe('anthropic');
    });
  });

  describe('processAllData', () => {
    it('should process all providers and their models', () => {
      const normalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
              },
            },
          },
        },
      };
      const overrides: OverrideConfig = {
        models: {
          'openai/gpt-4': {
            name: 'Updated GPT-4',
          },
        },
        providers: {
          'openai': {
            name: 'Updated OpenAI',
          },
        },
      };
      const sourceProviderIds = new Set(['openai']);
      const result = dataProcessor.processAllData(normalizedData, overrides, sourceProviderIds);
      
      expect(result.providers['openai'].name).toBe('Updated OpenAI');
      expect(result.providers['openai'].iconURL).toBe('https://models.dev/logos/openai.svg');
      expect(result.providers['openai'].models['gpt-4'].name).toBe('Updated GPT-4');
    });
  });

  describe('localizeNormalizedData', () => {
    it('should apply i18n localization to providers and models', () => {
      const data: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
                description: 'GPT-4 is an AI model provided by openai.',
              },
            },
          },
        },
      };
      const overrides: OverrideConfig = {
        i18n: {
          providers: {
            'openai': {
              name: { 'zh-CN': '开放AI' },
              description: { 'zh-CN': '中文介绍' },
            },
          },
          models: {
            'openai/gpt-4': {
              name: { 'zh-CN': 'GPT-4增强版' },
              description: { 'zh-CN': '这是一个强大的AI模型' },
            },
          },
        },
      };
      const result = dataProcessor.localizeNormalizedData(data, overrides, 'zh-CN');
      
      expect(result.providers['openai'].name).toBe('开放AI');
      expect(result.providers['openai'].description).toBe('中文介绍');
      expect(result.providers['openai'].models['gpt-4'].name).toBe('GPT-4增强版');
      expect(result.providers['openai'].models['gpt-4'].description).toBe('这是一个强大的AI模型');
    });

    it('should update default descriptions to locale-specific templates', () => {
      const data: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
                description: 'GPT-4 is an AI model provided by openai.', // matches default
              },
            },
          },
        },
      };
      const overrides: OverrideConfig = {
        i18n: {
          models: {},
        },
      };
      const result = dataProcessor.localizeNormalizedData(data, overrides, 'zh-CN');
      
      expect(result.providers['openai'].models['gpt-4'].description).toBe(
        'GPT-4 是由 openai 提供的人工智能模型。'
      );
    });

    it('should preserve custom descriptions that do not match defaults', () => {
      const data: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
                description: 'A custom description that is not default',
              },
            },
          },
        },
      };
      const overrides: OverrideConfig = {
        i18n: {
          models: {},
        },
      };
      const result = dataProcessor.localizeNormalizedData(data, overrides, 'zh-CN');
      
      expect(result.providers['openai'].models['gpt-4'].description).toBe(
        'A custom description that is not default'
      );
    });
  });
});