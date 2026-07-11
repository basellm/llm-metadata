import {
  formatTokensToKM,
  escapeMarkdownPipes,
  formatPricing,
  formatCapabilities,
  formatModalities,
  formatDetails,
  formatLimit,
  buildModelTags,
  buildModelPriceInfo,
  getMaxPrices,
} from './format-utils.js';
import { ModelCost } from '../types/index.js';
import { describe, test, expect } from '@jest/globals';

describe('Format Utils', () => {
  describe('formatTokensToKM', () => {
    test('should return null for invalid inputs', () => {
      expect(formatTokensToKM()).toBeNull();
      expect(formatTokensToKM(undefined)).toBeNull();
      expect(formatTokensToKM(-1)).toBeNull();
      expect(formatTokensToKM(0)).toBeNull();
      expect(formatTokensToKM(NaN)).toBeNull();
      // Infinity gets converted to a very large number and formatted
    });

    test('should format numbers correctly', () => {
      expect(formatTokensToKM(1)).toBe('1');
      expect(formatTokensToKM(999)).toBe('999');
      expect(formatTokensToKM(1000)).toBe('1K');
      expect(formatTokensToKM(1500)).toBe('1.5K');
      expect(formatTokensToKM(999999)).toBe('1000K'); // Rounds to nearest thousand
      expect(formatTokensToKM(1000000)).toBe('1M');
      expect(formatTokensToKM(1500000)).toBe('1.5M');
      expect(formatTokensToKM(2000000)).toBe('2M');
    });

    test('should keep integers as integers (not decimals)', () => {
      expect(formatTokensToKM(2000)).toBe('2K');
      expect(formatTokensToKM(2000000)).toBe('2M');
      expect(formatTokensToKM(2500000)).toBe('2.5M');
    });
  });

  describe('escapeMarkdownPipes', () => {
    test('should handle undefined and null input', () => {
      expect(escapeMarkdownPipes(undefined)).toBe('');
      expect(escapeMarkdownPipes('')).toBe('');
    });

    test('should escape pipe characters', () => {
      expect(escapeMarkdownPipes('')).toBe('');
      expect(escapeMarkdownPipes('no pipes')).toBe('no pipes');
      expect(escapeMarkdownPipes('|')).toBe('\\|');
      expect(escapeMarkdownPipes('col1|col2|col3')).toBe('col1\\|col2\\|col3');
      expect(escapeMarkdownPipes('start|middle|end')).toBe('start\\|middle\\|end');
    });

    test('should not escape other characters', () => {
      const input = 'Hello [world] (test) *bold* _italic_ #heading';
      expect(escapeMarkdownPipes(input)).toBe(input);
    });
  });

  describe('formatPricing', () => {
    test('should return "-" for undefined cost', () => {
      expect(formatPricing()).toBe('-');
    });

    test('should handle USD currency by default', () => {
      const cost: ModelCost = { input: 0.1, output: 0.2 };
      expect(formatPricing(cost)).toBe('Input: $0.1<br/>Output: $0.2');
    });

    test('should handle different currencies', () => {
      const costUSD: ModelCost = { input: 0.1, currency: 'USD' };
      expect(formatPricing(costUSD)).toBe('Input: $0.1<br/>Output: -');

      const costCNY: ModelCost = { input: 0.1, currency: 'CNY' };
      expect(formatPricing(costCNY)).toBe('Input: ¥0.1<br/>Output: -');

      const costEUR: ModelCost = { input: 0.1, currency: 'EUR' };
      expect(formatPricing(costEUR)).toBe('Input: €0.1<br/>Output: -');
    });

    test('should handle basic input/output fields', () => {
      const cost: ModelCost = { input: 0.1, output: 0.2 };
      expect(formatPricing(cost)).toBe('Input: $0.1<br/>Output: $0.2');
    });

    test('should handle output being undefined', () => {
      const cost: ModelCost = { input: 0.1 };
      expect(formatPricing(cost)).toBe('Input: $0.1<br/>Output: -');
    });

    test('should handle multilingual fields', () => {
      const cost: ModelCost = { text_input: 0.05, vision_input: 0.1 };
      expect(formatPricing(cost)).toBe('Text Input: $0.05<br/>Vision Input: $0.1');
    });

    test('should handle embedding fields', () => {
      const cost: ModelCost = { embedding_text: 0.01, embedding_image: 0.1 };
      expect(formatPricing(cost)).toBe('Text: $0.01/1K<br/>Image: $0.1/1K');
    });

    test('should handle per-unit billing', () => {
      const costPerSecond: ModelCost = { per_second: 0.1 };
      expect(formatPricing(costPerSecond)).toBe('$0.1/s');

      const costPer10kChars: ModelCost = { per_10k_chars: 0.2 };
      expect(formatPricing(costPer10kChars)).toBe('$0.2/10K chars');

      const costPerImage: ModelCost = { per_image: 0.5 };
      expect(formatPricing(costPerImage)).toBe('$0.5/img');
    });

    test('should handle special fields', () => {
      const costText: ModelCost = { text: 0.05 };
      expect(formatPricing(costText)).toBe('Text: $0.05');

      const costVL: ModelCost = { vl: 0.1 };
      expect(formatPricing(costVL)).toBe('VL: $0.1/1K');
    });

    test('should show other numeric fields', () => {
      const cost: ModelCost = { custom_field: 0.5, another_field: 1.0 };
      expect(formatPricing(cost)).toBe('Another Field: $1<br/>Custom Field: $0.5');
    });

    test('should handle mixed fields with other numeric fields', () => {
      const cost: ModelCost = {
        input: 0.1,
        output: 0.2,
        cache_read: 0.05,
        cache_write: 0.01,
      };
      // This will show all fields as additional numeric fields will be shown after the basic input/output pair
      const result = formatPricing(cost);
      expect(result).toContain('Input: $0.1');
      expect(result).toContain('Output: $0.2');
      expect(result).toContain('Cache Read: $0.05');
      expect(result).toContain('Cache Write: $0.01');
    });
  });

  describe('formatCapabilities', () => {
    test('should return "-" for empty capabilities', () => {
      expect(formatCapabilities({})).toBe('-');
    });

    test('should return emojis for enabled capabilities', () => {
      expect(formatCapabilities({ attachment: true })).toBe('📎');
      expect(formatCapabilities({ reasoning: true })).toBe('🧠');
      expect(formatCapabilities({ tool_call: true })).toBe('🔧');
      expect(formatCapabilities({ temperature: true })).toBe('🌡️');
    });

    test('should combine multiple capabilities', () => {
      expect(
        formatCapabilities({
          attachment: true,
          reasoning: true,
          tool_call: true,
        }),
      ).toBe('📎 🧠 🔧');
    });

    test('should handle false values', () => {
      expect(
        formatCapabilities({
          attachment: true,
          reasoning: false,
          tool_call: true,
        }),
      ).toBe('📎 🔧');
    });
  });

  describe('formatModalities', () => {
    test('should handle undefined modalities', () => {
      expect(formatModalities()).toBe('In: text<br/>Out: text');
    });

    test('should format input and output modalities', () => {
      expect(formatModalities({ input: ['text'], output: ['text'] })).toBe(
        'In: text<br/>Out: text',
      );

      expect(formatModalities({ input: ['image', 'text'], output: ['text'] })).toBe(
        'In: image, text<br/>Out: text',
      );

      expect(formatModalities({ input: ['text'], output: ['audio', 'text'] })).toBe(
        'In: text<br/>Out: audio, text',
      );
    });

    test('should show text as default when arrays are empty', () => {
      expect(formatModalities({ input: [], output: [] })).toBe('In: text<br/>Out: text');
    });
  });

  describe('formatDetails', () => {
    test('should return "-" for empty details', () => {
      expect(formatDetails({})).toBe('-');
    });

    test('should show open weights info', () => {
      expect(formatDetails({ open_weights: true })).toBe('Open Weights');
    });

    test('should show release date', () => {
      expect(formatDetails({ release_date: '2023-01-01' })).toBe('Released: 2023-01-01');
    });

    test('should show last updated date', () => {
      expect(formatDetails({ last_updated: '2023-12-01' })).toBe('Updated: 2023-12-01');
    });

    test('should show different release and updated dates', () => {
      expect(
        formatDetails({
          release_date: '2023-01-01',
          last_updated: '2023-12-01',
        }),
      ).toBe('Released: 2023-01-01<br/>Updated: 2023-12-01');
    });

    test('should skip updated when same as release date', () => {
      expect(
        formatDetails({
          release_date: '2023-01-01',
          last_updated: '2023-01-01',
        }),
      ).toBe('Released: 2023-01-01');
    });
  });

  describe('formatLimit', () => {
    test('should return "-" for invalid limits', () => {
      expect(formatLimit()).toBe('-');
      expect(formatLimit(null as any)).toBe('-');
      expect(formatLimit(0)).toBe('-');
      expect(formatLimit(-100)).toBe('-');
    });

    test('should format valid limits', () => {
      expect(formatLimit(1000)).toBe('1K');
      expect(formatLimit(1000000)).toBe('1M');
      expect(formatLimit(1500)).toBe('1.5K');
    });
  });

  describe('buildModelTags', () => {
    test('should handle empty model object', () => {
      expect(buildModelTags({})).toEqual([]);
    });

    test('should include string tags', () => {
      expect(buildModelTags({ tags: 'tag1,tag2;tag3' })).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should include array tags', () => {
      expect(buildModelTags({ tags: ['tag1', 'tag2'] })).toEqual(['tag1', 'tag2']);
    });

    test('should add capability-based tags', () => {
      expect(buildModelTags({ reasoning: true, tool_call: true })).toEqual([
        'reasoning',
        'tools',
      ]);
    });

    test('should add modality-based tags', () => {
      expect(buildModelTags({ modalities: { input: ['image'], output: [] } })).toEqual(['vision']);
      expect(buildModelTags({ modalities: { input: [], output: ['audio'] } })).toEqual(['audio']);
    });

    test('should add context window tags', () => {
      expect(buildModelTags({ limit: { context: 1000000 } })).toEqual(['1M']);
    });

    test('should combine all types of tags', () => {
      expect(
        buildModelTags({
          tags: 'existing_tag',
          reasoning: true,
          modalities: { input: ['image'] },
          limit: { context: 1000 },
        }),
      ).toEqual(['existing_tag', 'reasoning', 'vision', '1K']); // Order is based on processing sequence
    });
  });

  describe('buildModelPriceInfo', () => {
    test('should return null values for undefined cost', () => {
      expect(buildModelPriceInfo()).toEqual({
        input: null,
        output: null,
        cacheRead: null,
        cacheWrite: null,
      });
    });

    test('should return valid price values', () => {
      const cost: ModelCost = {
        input: 0.1,
        output: 0.2,
        cache_read: 0.05,
        cache_write: 0.01,
      };
      expect(buildModelPriceInfo(cost)).toEqual({
        input: 0.1,
        output: 0.2,
        cacheRead: 0.05,
        cacheWrite: 0.01,
      });
    });

    test('should return null for zero or negative prices', () => {
      const cost: ModelCost = {
        input: 0,
        output: -0.1,
        cache_read: 0.05,
        cache_write: 0.01,
      };
      expect(buildModelPriceInfo(cost)).toEqual({
        input: null,
        output: null,
        cacheRead: 0.05,
        cacheWrite: 0.01,
      });
    });
  });

  describe('getMaxPrices', () => {
    test('should return null values for undefined cost', () => {
      expect(getMaxPrices()).toEqual({
        maxInput: null,
        maxOutput: null,
        maxCacheRead: null,
      });
    });

    test('should find maximum input prices', () => {
      const cost: ModelCost = {
        input: 0.1,
        input_high: 0.3,
        input_low: 0.05,
      };
      expect(getMaxPrices(cost)).toEqual({
        maxInput: 0.3,
        maxOutput: null,
        maxCacheRead: null,
      });
    });

    test('should find maximum output prices', () => {
      const cost: ModelCost = {
        output: 0.2,
        output_high: 0.4,
        output_low: 0.1,
      };
      expect(getMaxPrices(cost)).toEqual({
        maxInput: null,
        maxOutput: 0.4,
        maxCacheRead: null,
      });
    });

    test('should find maximum cache read prices', () => {
      const cost: ModelCost = {
        cache_read: 0.05,
        cache_read_high: 0.1,
        cache_read_low: 0.01,
      };
      expect(getMaxPrices(cost)).toEqual({
        maxInput: null,
        maxOutput: null,
        maxCacheRead: 0.1,
      });
    });

    test('should handle multiple categories together', () => {
      const cost: ModelCost = {
        input: 0.1,
        input_high: 0.3,
        output: 0.2,
        output_high: 0.4,
        cache_read: 0.05,
        cache_read_high: 0.1,
      };
      expect(getMaxPrices(cost)).toEqual({
        maxInput: 0.3,
        maxOutput: 0.4,
        maxCacheRead: 0.1,
      });
    });
  });
});