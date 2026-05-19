import { describe, it, beforeEach, expect } from '@jest/globals';
import { VoAPIBuilder } from './voapi-builder.js';
import type { NormalizedData } from '../types/index.js';

describe('VoAPIBuilder', () => {
  let builder: VoAPIBuilder;

  beforeEach(() => {
    builder = new VoAPIBuilder();
  });

  describe('buildFirms', () => {
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