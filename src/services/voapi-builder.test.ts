import { describe, it, beforeEach, expect } from '@jest/globals';
import { VoAPIBuilder } from './voapi-builder.js';
import type { NormalizedData } from '../types/index.js';

describe('VoAPIBuilder', () => {
  let builder: VoAPIBuilder;

  beforeEach(() => {
    builder = new VoAPIBuilder();
  });

  describe('buildFirms', () => {
    it('should build firms and models from normalized data', () => {
      const mockData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            description: 'OpenAI Description',
            api: 'https://api.openai.com',
            doc: 'https://docs.openai.com',
            icon: 'icon-url',
            iconURL: 'https://example.com/icon.png',
            lobeIcon: 'chatgpt.svg',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
                description: 'GPT-4 Model',
                icon: 'gpt-icon',
                attachment: true,
                reasoning: true,
                tool_call: true,
                temperature: true,
                limit: {
                  context: 8192,
                  output: 4096,
                },
                cost: {
                  input: 0.03,
                  output: 0.06,
                },
                modalities: {
                  input: ['text', 'image'],
                  output: ['text'],
                },
              },
              'gpt-3.5': {
                id: 'gpt-3.5',
                name: 'GPT-3.5',
                description: 'GPT-3.5 Model',
                icon: 'gpt35-icon',
              },
            },
          },
          'anthropic': {
            id: 'anthropic',
            name: 'Anthropic',
            description: 'Anthropic Description',
            lobeIcon: 'claude.svg',
            models: {
              'claude-3': {
                id: 'claude-3',
                name: 'Claude-3',
                description: 'Claude-3 Model',
                reasoning: true,
              },
            },
          },
        },
      };

      const result = builder.buildFirms(mockData);

      expect(result.firms).toHaveLength(2);
      expect(result.models).toHaveLength(3);

      // Check OpenAI firm
      const openaiFirm = result.firms.find(f => f.id === 'openai');
      expect(openaiFirm).toBeDefined();
      expect(openaiFirm!.name).toBe('OpenAI');
      expect(openaiFirm!.description).toBe('OpenAI Description');
      expect(openaiFirm!.icon).toBe('lb:chatgpt-svg');
      expect(openaiFirm!.modelCount).toBe(2);
      expect(openaiFirm!.api).toBe('https://api.openai.com');
      expect(openaiFirm!.doc).toBe('https://docs.openai.com');
      expect(openaiFirm!.status).toBe(1);

      // Check GPT-4 model
      const gpt4Model = result.models.find(m => m.id === 'gpt-4');
      expect(gpt4Model).toBeDefined();
      expect(gpt4Model!.name).toBe('GPT-4');
      expect(gpt4Model!.description).toBe('GPT-4 Model');
      expect(gpt4Model!.icon).toBe('lb:gpt-icon');
      expect(gpt4Model!.firm).toBe('openai');
      expect(gpt4Model!.maxCtxTokens).toBe(8192);
      expect(gpt4Model!.maxOutputTokens).toBe(4096);
      expect(gpt4Model!.flags).toEqual({
        attachment: true,
        reasoning: true,
        tool_call: true,
        temperature: true,
        image: true,
        audio: false,
      });
      expect(gpt4Model!.price).toEqual({
        input: 0.03,
        output: 0.06,
        cacheRead: null,
        cacheWrite: null,
      });
    });

    it('should handle empty providers object', () => {
      const mockData: NormalizedData = {
        providers: {},
      };

      const result = builder.buildFirms(mockData);

      expect(result.firms).toHaveLength(0);
      expect(result.models).toHaveLength(0);
    });

    it('should handle providers with no models', () => {
      const mockData: NormalizedData = {
        providers: {
          'empty-provider': {
            id: 'empty-provider',
            name: 'Empty Provider',
            models: {},
          },
        },
      };

      const result = builder.buildFirms(mockData);

      expect(result.firms).toHaveLength(1);
      expect(result.firms[0].id).toBe('empty-provider');
      expect(result.firms[0].modelCount).toBe(0);
      expect(result.models).toHaveLength(0);
    });

    it('should sort providers by ID', () => {
      const mockData: NormalizedData = {
        providers: {
          'z-provider': {
            id: 'z-provider',
            name: 'Z Provider',
            models: {
              'model-z': {
                id: 'model-z',
                name: 'Model Z',
              },
            },
          },
          'a-provider': {
            id: 'a-provider',
            name: 'A Provider',
            models: {
              'model-a': {
                id: 'model-a',
                name: 'Model A',
              },
            },
          },
        },
      };

      const result = builder.buildFirms(mockData);

      // Providers should be sorted by ID
      expect(result.firms.map(f => f.id)).toEqual(['a-provider', 'z-provider']);
    });

    it('should sort models by ID within each provider', () => {
      const mockData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'z-model': {
                id: 'z-model',
                name: 'Z Model',
              },
              'a-model': {
                id: 'a-model',
                name: 'A Model',
              },
            },
          },
        },
      };

      const result = builder.buildFirms(mockData);

      // Models should be sorted by ID
      expect(result.models.map(m => m.id)).toEqual(['a-model', 'z-model']);
    });

    it('should handle missing optional fields', () => {
      const mockData: NormalizedData = {
        providers: {
          'minimal-provider': {
            id: 'minimal-provider',
            models: {
              'minimal-model': {
                id: 'minimal-model',
              },
            },
          },
        },
      };

      const result = builder.buildFirms(mockData);

      expect(result.firms).toHaveLength(1);
      expect(result.models).toHaveLength(1);

      const firm = result.firms[0];
      expect(firm.name).toBe('minimal-provider'); // should fallback to ID when name is missing
      expect(firm.description).toBe('');
      expect(firm.icon).toBe('');
      expect(firm.modelCount).toBe(1);
      expect(firm.api).toBe('');
      expect(firm.doc).toBe('');

      const model = result.models[0];
      expect(model.name).toBe('minimal-model'); // should fallback to ID when name is missing
      expect(model.description).toBe('');
      expect(model.icon).toBe('');
      expect(model.firm).toBe('minimal-provider');
      expect(model.maxCtxTokens).toBe(0);
      expect(model.maxOutputTokens).toBe(0);
      expect(model.flags).toEqual({
        attachment: false,
        reasoning: false,
        tool_call: false,
        temperature: false,
        image: false,
        audio: false,
      });
      expect(model.price).toEqual({
        input: null,
        output: null,
        cacheRead: null,
        cacheWrite: null,
      });
    });

    it('should handle icon formatting properly', () => {
      const mockData: NormalizedData = {
        providers: {
          'test-provider': {
            id: 'test-provider',
            name: 'Test Provider',
            lobeIcon: 'test.icon',
            models: {
              'test-model': {
                id: 'test-model',
                icon: 'model.dot.file',
              },
              'fallback-model': {
                id: 'fallback-model',
                // No icon, should fall back to provider
              },
            },
          },
        },
      };

      const result = builder.buildFirms(mockData);

      // Model with its own icon - 'model.dot.file' becomes 'model-dot-file' then 'lb:model-dot-file'
      const modelWithIcon = result.models.find(m => m.id === 'test-model');
      expect(modelWithIcon!.icon).toBe('lb:model-dot-file');

      // Model falling back to provider icon - 'test.icon' becomes 'test-icon' then 'lb:test-icon'
      const modelWithFallback = result.models.find(m => m.id === 'fallback-model');
      expect(modelWithFallback!.icon).toBe('lb:test-icon');

      // Firm icon - 'test.icon' becomes 'test-icon' then 'lb:test-icon'
      expect(result.firms[0].icon).toBe('lb:test-icon');
    });

    it('should correctly handle model flags', () => {
      const mockData: NormalizedData = {
        providers: {
          'flag-test': {
            id: 'flag-test',
            models: {
              'full-features': {
                id: 'full-features',
                attachment: true,
                reasoning: true,
                tool_call: true,
                temperature: true,
                modalities: {
                  input: ['image', 'audio'],
                  output: ['text'],
                },
              },
              'no-features': {
                id: 'no-features',
                // All flags should be false
              },
            },
          },
        },
      };

      const result = builder.buildFirms(mockData);

      const fullFeaturesModel = result.models.find(m => m.id === 'full-features');
      expect(fullFeaturesModel!.flags).toEqual({
        attachment: true,
        reasoning: true,
        tool_call: true,
        temperature: true,
        image: true,
        audio: true,
      });

      const noFeaturesModel = result.models.find(m => m.id === 'no-features');
      expect(noFeaturesModel!.flags).toEqual({
        attachment: false,
        reasoning: false,
        tool_call: false,
        temperature: false,
        image: false,
        audio: false,
      });
    });

    it('should handle tag mapping', () => {
      const mockData: NormalizedData = {
        providers: {
          'tag-test': {
            id: 'tag-test',
            models: {
              'tagged-model': {
                id: 'tagged-model',
                tags: ['original-tag'],
                tool_call: true,
                reasoning: true,
                modalities: {
                  input: ['image'],
                },
              },
            },
          },
        },
      };

      const tagMap = {
        'original-tag': 'mapped-tag',
        'tools': 'capabilities',
        'reasoning': 'smart',
      };

      const result = builder.buildFirms(mockData, tagMap);

      const model = result.models[0];
      expect(model.tags).toContain('mapped-tag'); // original tag mapped
      expect(model.tags).toContain('capabilities'); // tool_call mapped to capabilities
      expect(model.tags).toContain('smart'); // reasoning mapped to smart
      expect(model.tags).toContain('vision'); // image modality mapped to vision
    });

    it('should handle cost extraction correctly', () => {
      const mockData: NormalizedData = {
        providers: {
          'cost-test': {
            id: 'cost-test',
            models: {
              'priced-model': {
                id: 'priced-model',
                cost: {
                  input: 0.01,
                  output: 0.02,
                  cache_read: 0.003,
                  cache_write: 0.004,
                },
              },
              'free-model': {
                id: 'free-model',
                cost: {
                  input: 0,
                  output: -1, // negative should be treated as null
                },
              },
            },
          },
        },
      };

      const result = builder.buildFirms(mockData);

      const pricedModel = result.models.find(m => m.id === 'priced-model');
      expect(pricedModel!.price).toEqual({
        input: 0.01,
        output: 0.02,
        cacheRead: 0.003,
        cacheWrite: 0.004,
      });

      const freeModel = result.models.find(m => m.id === 'free-model');
      expect(freeModel!.price).toEqual({
        input: null,
        output: null,
        cacheRead: null,
        cacheWrite: null,
      });
    });
  });
});