/// <reference types="jest" />

import { NewApiBuilder } from './newapi-builder.js';
import type {
  Model,
  ModelCost,
  NewApiPriceConfig,
  NewApiSyncPayload,
  NormalizedData,
} from '../types/index.js';

describe('NewApiBuilder', () => {
  let builder: NewApiBuilder;

  beforeEach(() => {
    builder = new NewApiBuilder();
  });

  describe('calculateRatios', () => {
    it('should return null when maxInput is not available', () => {
      const mockCost: ModelCost = {
        input: 0,
        output: 1,
      };
      // Since calculateRatios is private, we'll test it through methods that use it
      const result = (builder as any).buildPricingFields(mockCost);
      expect(result.ratio_model).toBeNull();
    });

    it('should calculate ratios correctly when cost data is available', () => {
      const mockCost: ModelCost = {
        input: 2,
        output: 8,
        cache_read: 4,
      };

      const result = (builder as any).buildPricingFields(mockCost);
      expect(result.ratio_model).toBe(1); // maxInput / 2 = 2 / 2
      expect(result.ratio_completion).toBe(4); // maxOutput / maxInput = 8 / 2
      expect(result.ratio_cache).toBe(2); // maxCacheRead / maxInput = 4 / 2
    });

    it('should handle missing optional ratios', () => {
      const mockCost: ModelCost = {
        input: 4,
        output: 8,
        // Missing cacheRead
      };

      const result = (builder as any).buildPricingFields(mockCost);
      expect(result.ratio_model).toBe(2); // input / 2 = 4 / 2
      expect(result.ratio_completion).toBe(2); // output / input = 8 / 4
      expect(result.ratio_cache).toBeNull(); // cacheRead is missing
    });
  });

  describe('getMinUnitPrice', () => {
    it('should return null when cost is undefined', () => {
      const result = (builder as any).getMinUnitPrice(undefined);
      expect(result).toBeNull();
    });

    it('should return null when no unit prices are found', () => {
      const mockCost: ModelCost = {
        input: 1,
        output: 2,
      };
      const result = (builder as any).getMinUnitPrice(mockCost);
      expect(result).toBeNull();
    });

    it('should return minimum unit price for per_image', () => {
      const mockCost: ModelCost = {
        input: 1,
        per_image_basic: 0.05,
        per_image_hd: 0.1,
      };
      const result = (builder as any).getMinUnitPrice(mockCost);
      expect(result).toBe(0.05);
    });

    it('should return minimum unit price for per_second', () => {
      const mockCost: ModelCost = {
        input: 1,
        per_second_high: 0.2,
        per_second_standard: 0.1,
      };
      const result = (builder as any).getMinUnitPrice(mockCost);
      expect(result).toBe(0.1);
    });

    it('should return minimum unit price for per_10k_chars', () => {
      const mockCost: ModelCost = {
        input: 1,
        per_10k_chars: 0.15,
        per_10k_chars_advanced: 0.25,
      };
      const result = (builder as any).getMinUnitPrice(mockCost);
      expect(result).toBe(0.15);
    });

    it('should ignore zero or negative values', () => {
      const mockCost: ModelCost = {
        input: 1,
        per_image: 0,
        per_second: -1,
        per_10k_chars: 0.1,
      };
      const result = (builder as any).getMinUnitPrice(mockCost);
      expect(result).toBe(0.1);
    });
  });

  describe('buildPricingFields', () => {
    it('should build pricing fields with all cost values', () => {
      const mockCost: ModelCost = {
        input: 2,
        output: 8,
        cache_read: 4,
        cache_write: 1,
      };
      const result = (builder as any).buildPricingFields(mockCost);
      expect(result.price_per_m_input).toBe(2);
      expect(result.price_per_m_output).toBe(8);
      expect(result.price_per_m_cache_read).toBe(4);
      expect(result.price_per_m_cache_write).toBe(1);
      expect(result.ratio_model).toBe(1); // 2 / 2
      expect(result.ratio_completion).toBe(4); // 8 / 2
      expect(result.ratio_cache).toBe(2); // 4 / 2
    });

    it('should handle missing optional costs', () => {
      const mockCost: ModelCost = {
        input: 4,
        output: 8,
        // Missing cache entries
      };
      const result = (builder as any).buildPricingFields(mockCost);
      expect(result.price_per_m_input).toBe(4);
      expect(result.price_per_m_output).toBe(8);
      expect(result.price_per_m_cache_read).toBeNull();
      expect(result.price_per_m_cache_write).toBeNull();
      expect(result.ratio_model).toBe(2); // 4 / 2
      expect(result.ratio_completion).toBe(2); // 8 / 4
      expect(result.ratio_cache).toBeNull();
    });
  });

  describe('buildSyncPayload', () => {
    it('should build sync payload with vendors and models', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            description: 'OpenAI provider',
            lobeIcon: 'openai-icon',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                description: 'GPT-4 model',
                cost: { input: 2, output: 8 },
                icon: 'gpt-4-icon',
              } as Model,
            },
          },
        },
      };

      const result: NewApiSyncPayload = builder.buildSyncPayload(mockNormalizedData);

      expect(result.vendors).toHaveLength(1);
      expect(result.vendors[0]).toEqual({
        name: 'OpenAI',
        description: 'OpenAI provider',
        icon: 'openai-icon',
        status: 1,
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toMatchObject({
        model_name: 'gpt-4',
        description: 'GPT-4 model',
        vendor_name: 'OpenAI',
        status: 1,
        name_rule: 0,
        icon: 'gpt-4-icon',
      });
    });

    it('should handle multiple providers and models', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            description: 'OpenAI provider',
            lobeIcon: 'openai-icon',
            models: {
              'gpt-3.5': {
                id: 'gpt-3.5',
                description: 'GPT-3.5 model',
                cost: { input: 1, output: 2 },
              } as Model,
              'gpt-4': {
                id: 'gpt-4',
                description: 'GPT-4 model',
                cost: { input: 2, output: 8 },
              } as Model,
            },
          },
          'anthropic': {
            id: 'anthropic',
            name: 'Anthropic',
            description: 'Anthropic provider',
            lobeIcon: 'anthropic-icon',
            models: {
              'claude-2': {
                id: 'claude-2',
                description: 'Claude 2 model',
                cost: { input: 1.5, output: 3 },
              } as Model,
            },
          },
        },
      };

      const result: NewApiSyncPayload = builder.buildSyncPayload(mockNormalizedData);

      expect(result.vendors).toHaveLength(2);
      expect(result.models).toHaveLength(3);
      expect(result.models.map(m => m.model_name)).toContain('gpt-3.5');
      expect(result.models.map(m => m.model_name)).toContain('gpt-4');
      expect(result.models.map(m => m.model_name)).toContain('claude-2');
    });

    it('should sort providers alphabetically', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'z-provider': {
            id: 'z-provider',
            name: 'Z Provider',
            lobeIcon: 'z-icon',
            models: {
              'model-z': {
                id: 'model-z',
                cost: { input: 1 },
              } as Model,
            },
          },
          'a-provider': {
            id: 'a-provider',
            name: 'A Provider',
            lobeIcon: 'a-icon',
            models: {
              'model-a': {
                id: 'model-a',
                cost: { input: 1 },
              } as Model,
            },
          },
        },
      };

      const result: NewApiSyncPayload = builder.buildSyncPayload(mockNormalizedData);

      expect(result.vendors[0].name).toBe('A Provider');
      expect(result.vendors[1].name).toBe('Z Provider');
    });

    it('should sort models alphabetically within each provider', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            lobeIcon: 'openai-icon',
            models: {
              'z-model': {
                id: 'z-model',
                cost: { input: 1 },
              } as Model,
              'a-model': {
                id: 'a-model',
                cost: { input: 1 },
              } as Model,
              'm-model': {
                id: 'm-model',
                cost: { input: 1 },
              } as Model,
            },
          },
        },
      };

      const result: NewApiSyncPayload = builder.buildSyncPayload(mockNormalizedData);

      const openaiModels = result.models.filter(m => m.vendor_name === 'OpenAI');
      expect(openaiModels.map(m => m.model_name)).toEqual(['a-model', 'm-model', 'z-model']);
    });

    it('should handle missing provider properties with defaults', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'test-provider': {
            id: 'test-provider',
            name: '',
            // Missing description and lobeIcon
            models: {
              'test-model': {
                id: 'test-model',
                cost: { input: 1 },
              } as Model,
            },
          },
        },
      };

      const result: NewApiSyncPayload = builder.buildSyncPayload(mockNormalizedData);

      expect(result.vendors[0]).toEqual({
        name: 'test-provider', // Falls back to ID when name is empty
        description: '',
        icon: '',
        status: 1,
      });
    });

    it('should handle missing model properties with defaults', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'test-provider': {
            id: 'test-provider',
            name: 'Test Provider',
            lobeIcon: 'test-icon',
            models: {
              'test-model': {
                id: 'test-model',
                // Only cost defined
                cost: { input: 1 },
              } as Model,
            },
          },
        },
      };

      const result: NewApiSyncPayload = builder.buildSyncPayload(mockNormalizedData);

      expect(result.models[0]).toMatchObject({
        model_name: 'test-model',
        description: '', // Default when missing
        tags: '',
        vendor_name: 'Test Provider',
        endpoints: null,
        status: 1,
        name_rule: 0,
        icon: 'test-icon', // Falls back to provider icon when model icon is missing
      });
    });
  });

  describe('buildPriceConfig', () => {
    it('should build price config with model ratios when no unit pricing exists', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                cost: { input: 2, output: 8, cache_read: 4 },
              } as Model,
            },
          },
        },
      };

      const result: NewApiPriceConfig = builder.buildPriceConfig(mockNormalizedData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('');
      expect(result.data.model_ratio).toEqual({ 'gpt-4': 1 }); // input/2 = 2/2
      expect(result.data.completion_ratio).toEqual({ 'gpt-4': 4 }); // output/input = 8/2
      expect(result.data.cache_ratio).toEqual({ 'gpt-4': 2 }); // cacheRead/input = 4/2
      expect(result.data.model_price).toEqual({});
    });

    it('should build price config with model_price for unit pricing models', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'openrouter': {
            id: 'openrouter',
            name: 'OpenRouter',
            models: {
              'dall-e-3': {
                id: 'dall-e-3',
                cost: {
                  input: 0,
                  output: 0,
                  per_image_basic: 0.04,
                  per_image_hd: 0.08
                },
              } as Model,
            },
          },
        },
      };

      const result: NewApiPriceConfig = builder.buildPriceConfig(mockNormalizedData);

      expect(result.data.model_price).toEqual({ 'dall-e-3': 0.04 }); // Minimum of per_image prices
      expect(result.data.model_ratio).toEqual({});
      expect(result.data.completion_ratio).toEqual({});
      expect(result.data.cache_ratio).toEqual({});
    });

    it('should filter by provider when providerId is specified', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                cost: { input: 2, output: 8 },
              } as Model,
            },
          },
          'anthropic': {
            id: 'anthropic',
            name: 'Anthropic',
            models: {
              'claude-2': {
                id: 'claude-2',
                cost: { input: 1.5, output: 3 },
              } as Model,
            },
          },
        },
      };

      const result: NewApiPriceConfig = builder.buildPriceConfig(mockNormalizedData, 'openai');

      expect(Object.keys(result.data.model_ratio)).toEqual(['gpt-4']);
      expect(Object.keys(result.data.completion_ratio)).toEqual(['gpt-4']);
      expect(Object.keys(result.data.cache_ratio)).toEqual([]);
      expect(Object.keys(result.data.model_price)).toEqual([]);
    });

    it('should return empty config when filtered provider does not exist', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'openai': {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                cost: { input: 2, output: 8 },
              } as Model,
            },
          },
        },
      };

      const result: NewApiPriceConfig = builder.buildPriceConfig(mockNormalizedData, 'nonexistent');

      expect(result.data.model_ratio).toEqual({});
      expect(result.data.completion_ratio).toEqual({});
      expect(result.data.cache_ratio).toEqual({});
      expect(result.data.model_price).toEqual({});
    });

    it('should handle mixed unit and non-unit pricing models', () => {
      const mockNormalizedData: NormalizedData = {
        providers: {
          'mixed': {
            id: 'mixed',
            name: 'Mixed Provider',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                cost: { input: 2, output: 8 },
              } as Model,
              'dall-e-3': {
                id: 'dall-e-3',
                cost: {
                  input: 0,
                  output: 0,
                  per_image_basic: 0.04
                },
              } as Model,
            },
          },
        },
      };

      const result: NewApiPriceConfig = builder.buildPriceConfig(mockNormalizedData);

      expect(result.data.model_ratio).toEqual({ 'gpt-4': 1 });
      expect(result.data.completion_ratio).toEqual({ 'gpt-4': 4 });
      expect(result.data.cache_ratio).toEqual({});
      expect(result.data.model_price).toEqual({ 'dall-e-3': 0.04 });
    });
  });
});