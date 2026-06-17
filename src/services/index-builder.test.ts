import { IndexBuilder } from './index-builder.js';
import type {
  NormalizedData,
  OverrideConfig,
  IndexOutput,
  ProvidersOutput,
} from '../types/index.js';
import { describe, it, beforeEach, expect } from '@jest/globals';

describe('IndexBuilder', () => {
  let indexBuilder: IndexBuilder;

  beforeEach(() => {
    indexBuilder = new IndexBuilder();
  });

  describe('buildIndexes', () => {
    it('should build indexes correctly with basic providers and models', () => {
      const normalized: NormalizedData = {
        providers: {
          openai: {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
                last_updated: '2023-01-01',
              },
            },
          },
        },
      };

      const overrides: OverrideConfig = {};

      const result = indexBuilder.buildIndexes(normalized, overrides);

      expect(result).toEqual({
        providers: [
          {
            id: 'openai',
            name: 'OpenAI',
            api: undefined,
            doc: undefined,
            icon: undefined,
            iconURL: undefined,
            lobeIcon: undefined,
            modelCount: 1,
          },
        ],
        models: [
          {
            id: 'gpt-4',
            providerId: 'openai',
            name: 'GPT-4',
            updated: '2023-01-01',
            flags: {
              attachment: false,
              reasoning: false,
              tool_call: false,
            },
          },
        ],
      });
    });

    it('should handle providers with no models', () => {
      const normalized: NormalizedData = {
        providers: {
          emptyProvider: {
            id: 'emptyProvider',
            name: 'Empty Provider',
            models: {},
          },
        },
      };

      const overrides: OverrideConfig = {};

      const result = indexBuilder.buildIndexes(normalized, overrides);

      expect(result).toEqual({
        providers: [
          {
            id: 'emptyProvider',
            name: 'Empty Provider',
            api: undefined,
            doc: undefined,
            icon: undefined,
            iconURL: undefined,
            lobeIcon: undefined,
            modelCount: 0,
          },
        ],
        models: [],
      });
    });

    it('should merge override configurations correctly', () => {
      const normalized: NormalizedData = {
        providers: {
          openai: {
            id: 'openai',
            name: 'Original OpenAI',
            api: 'original-api-endpoint',
            doc: 'original-doc-url',
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
        providers: {
          openai: {
            name: 'Overridden OpenAI',
            api: 'overridden-api-endpoint',
            iconURL: 'https://example.com/icon.png',
          },
        },
      };

      const result = indexBuilder.buildIndexes(normalized, overrides);

      expect(result.providers[0]).toMatchObject({
        id: 'openai',
        name: 'Overridden OpenAI',
        api: 'overridden-api-endpoint',
        doc: 'original-doc-url', // Should come from original since not overridden
        iconURL: 'https://example.com/icon.png',
        modelCount: 1,
      });
    });

    it('should handle model flags correctly', () => {
      const normalized: NormalizedData = {
        providers: {
          provider: {
            id: 'provider',
            name: 'Test Provider',
            models: {
              'model-with-flags': {
                id: 'model-with-flags',
                name: 'Model With Flags',
                attachment: true,
                reasoning: true,
                tool_call: true,
              },
              'model-without-flags': {
                id: 'model-without-flags',
                name: 'Model Without Flags',
              },
            },
          },
        },
      };

      const overrides: OverrideConfig = {};

      const result = indexBuilder.buildIndexes(normalized, overrides);

      expect(result.models).toContainEqual(
        expect.objectContaining({
          id: 'model-with-flags',
          flags: {
            attachment: true,
            reasoning: true,
            tool_call: true,
          },
        }),
      );

      expect(result.models).toContainEqual(
        expect.objectContaining({
          id: 'model-without-flags',
          flags: {
            attachment: false,
            reasoning: false,
            tool_call: false,
          },
        }),
      );
    });

    it('should handle missing model names', () => {
      const normalized: NormalizedData = {
        providers: {
          provider: {
            id: 'provider',
            name: 'Test Provider',
            models: {
              'model-id-without-name': {
                id: 'model-id-without-name',
              },
            },
          },
        },
      };

      const overrides: OverrideConfig = {};

      const result = indexBuilder.buildIndexes(normalized, overrides);

      expect(result.models[0].name).toBe('model-id-without-name');
    });

    it('should count modelCount correctly', () => {
      const normalized: NormalizedData = {
        providers: {
          provider1: {
            id: 'provider1',
            name: 'Provider 1',
            models: {
              'model1': {
                id: 'model1',
              },
              'model2': {
                id: 'model2',
              },
            },
          },
          provider2: {
            id: 'provider2',
            name: 'Provider 2',
            models: {
              'model3': {
                id: 'model3',
              },
              'model4': {
                id: 'model4',
              },
              'model5': {
                id: 'model5',
              },
            },
          },
        },
      };

      const overrides: OverrideConfig = {};

      const result = indexBuilder.buildIndexes(normalized, overrides);

      const provider1 = result.providers.find(p => p.id === 'provider1');
      const provider2 = result.providers.find(p => p.id === 'provider2');

      expect(provider1?.modelCount).toBe(2);
      expect(provider2?.modelCount).toBe(3);
    });

    it('should handle updated timestamps from both last_updated and release_date', () => {
      const normalized: NormalizedData = {
        providers: {
          provider: {
            id: 'provider',
            name: 'Test Provider',
            models: {
              'model-with-last-updated': {
                id: 'model-with-last-updated',
                last_updated: '2023-06-01',
              },
              'model-with-release-date': {
                id: 'model-with-release-date',
                release_date: '2023-07-01',
              },
              'model-with-both': {
                id: 'model-with-both',
                last_updated: '2023-05-01',
                release_date: '2023-08-01', // Should prefer last_updated
              },
            },
          },
        },
      };

      const overrides: OverrideConfig = {};

      const result = indexBuilder.buildIndexes(normalized, overrides);

      const modelWithLastUpdated = result.models.find(m => m.id === 'model-with-last-updated');
      const modelWithReleaseDate = result.models.find(m => m.id === 'model-with-release-date');
      const modelWithBoth = result.models.find(m => m.id === 'model-with-both');

      expect(modelWithLastUpdated?.updated).toBe('2023-06-01');
      expect(modelWithReleaseDate?.updated).toBe('2023-07-01');
      expect(modelWithBoth?.updated).toBe('2023-05-01'); // Should prefer last_updated
    });

    it('should sort providers alphabetically by ID', () => {
      const normalized: NormalizedData = {
        providers: {
          zzz_provider: {
            id: 'zzz_provider',
            name: 'Z Provider',
            models: {
              'z_model': {
                id: 'z_model',
              },
            },
          },
          aaa_provider: {
            id: 'aaa_provider',
            name: 'A Provider',
            models: {
              'a_model': {
                id: 'a_model',
              },
            },
          },
          mmm_provider: {
            id: 'mmm_provider',
            name: 'M Provider',
            models: {
              'm_model': {
                id: 'm_model',
              },
            },
          },
        },
      };

      const overrides: OverrideConfig = {};

      const result = indexBuilder.buildIndexes(normalized, overrides);

      const providerIds = result.providers.map(p => p.id);
      expect(providerIds).toEqual(['aaa_provider', 'mmm_provider', 'zzz_provider']);
    });

    it('should sort models by providerId then by ID', () => {
      const normalized: NormalizedData = {
        providers: {
          provider_a: {
            id: 'provider_a',
            name: 'A Provider',
            models: {
              'z_model': {
                id: 'z_model',
              },
              'a_model': {
                id: 'a_model',
              },
            },
          },
          provider_b: {
            id: 'provider_b',
            name: 'B Provider',
            models: {
              'z_model': {
                id: 'z_model',
              },
              'a_model': {
                id: 'a_model',
              },
            },
          },
        },
      };

      const overrides: OverrideConfig = {};

      const result = indexBuilder.buildIndexes(normalized, overrides);

      // Models should be sorted by providerId first, then by model ID
      const modelProviders = result.models.map(m => ({ providerId: m.providerId, id: m.id }));
      expect(modelProviders).toEqual([
        { providerId: 'provider_a', id: 'a_model' },
        { providerId: 'provider_a', id: 'z_model' },
        { providerId: 'provider_b', id: 'a_model' },
        { providerId: 'provider_b', id: 'z_model' },
      ]);
    });

    it('should handle all possible provider properties', () => {
      const normalized: NormalizedData = {
        providers: {
          full_provider: {
            id: 'full_provider',
            name: 'Full Provider',
            api: 'https://api.example.com',
            doc: 'https://docs.example.com',
            iconURL: 'https://example.com/icon.png',
            lobeIcon: 'lobe-icon-class',
            models: {
              'test_model': {
                id: 'test_model',
              },
            },
          },
        },
      };

      const overrides: OverrideConfig = {};

      const result = indexBuilder.buildIndexes(normalized, overrides);

      const provider = result.providers[0];
      expect(provider).toMatchObject({
        id: 'full_provider',
        name: 'Full Provider',
        api: 'https://api.example.com',
        doc: 'https://docs.example.com',
        iconURL: 'https://example.com/icon.png',
        lobeIcon: 'lobe-icon-class',
        modelCount: 1,
      });
    });

    it('should handle deeply nested override merges', () => {
      // Testing that the deepMerge function works correctly with nested objects
      // Though our current implementation doesn't seem to have nested structures beyond the surface level
      const normalized: NormalizedData = {
        providers: {
          complex_provider: {
            id: 'complex_provider',
            name: 'Complex Provider',
            models: {
              'complex_model': {
                id: 'complex_model',
                name: 'Complex Model',
              },
            },
          },
        },
      };

      const overrides: OverrideConfig = {
        providers: {
          complex_provider: {
            name: 'Overridden Complex Provider',
          },
        },
      };

      const result = indexBuilder.buildIndexes(normalized, overrides);

      expect(result.providers[0].name).toBe('Overridden Complex Provider');
      expect(result.models[0].name).toBe('Complex Model');
    });
  });

  describe('buildProvidersOutput', () => {
    it('should create ProvidersOutput from IndexOutput', () => {
      const indexes: IndexOutput = {
        providers: [
          {
            id: 'test-provider',
            name: 'Test Provider',
            api: undefined,
            doc: undefined,
            icon: undefined,
            iconURL: undefined,
            lobeIcon: undefined,
            modelCount: 1,
          },
        ],
        models: [
          {
            id: 'test-model',
            providerId: 'test-provider',
            name: 'Test Model',
            updated: undefined,
            flags: {
              attachment: false,
              reasoning: false,
              tool_call: false,
            },
          },
        ],
      };

      const result = indexBuilder.buildProvidersOutput(indexes);

      expect(result).toEqual({
        providers: [
          {
            id: 'test-provider',
            name: 'Test Provider',
            api: undefined,
            doc: undefined,
            icon: undefined,
            iconURL: undefined,
            lobeIcon: undefined,
            modelCount: 1,
          },
        ],
      } as ProvidersOutput);
    });

    it('should only include providers property in output', () => {
      const indexes: IndexOutput = {
        providers: [
          {
            id: 'provider1',
            name: 'Provider 1',
            api: undefined,
            doc: undefined,
            icon: undefined,
            iconURL: undefined,
            lobeIcon: undefined,
            modelCount: 0
          },
        ],
        models: [
          {
            id: 'model1',
            providerId: 'provider1',
            name: 'Model 1',
            updated: undefined,
            flags: {
              attachment: false,
              reasoning: false,
              tool_call: false,
            }
          },
        ],
      };

      const result = indexBuilder.buildProvidersOutput(indexes);

      expect(result).toHaveProperty('providers');
      expect(result).not.toHaveProperty('models');
      expect(Object.keys(result)).toEqual(['providers']);
    });
  });
});