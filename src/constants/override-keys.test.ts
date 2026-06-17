import {
  ALLOWED_MODEL_OVERRIDE_KEYS,
  ALLOWED_MODEL_OVERRIDE_KEY_SET,
  type AllowedModelOverrideKey,
} from './override-keys.js';
import { describe, it, expect } from '@jest/globals';

describe('override-keys constants', () => {
  describe('ALLOWED_MODEL_OVERRIDE_KEYS', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(ALLOWED_MODEL_OVERRIDE_KEYS)).toBe(true);
      expect(ALLOWED_MODEL_OVERRIDE_KEYS.every((key: string) => typeof key === 'string')).toBe(true);
    });

    it('should contain expected keys', () => {
      const expectedKeys = [
        'id',
        'name',
        'description',
        'reasoning',
        'tool_call',
        'attachment',
        'temperature',
        'knowledge',
        'release_date',
        'last_updated',
        'open_weights',
        'modalities',
        'limit',
        'cost',
        'currency',
      ];

      expect(ALLOWED_MODEL_OVERRIDE_KEYS).toEqual(expectedKeys);
    });

    it('should have unique values', () => {
      const uniqueKeys = [...new Set(ALLOWED_MODEL_OVERRIDE_KEYS)];
      expect(uniqueKeys).toEqual(ALLOWED_MODEL_OVERRIDE_KEYS);
    });

    // Test type safety by verifying a few values can be assigned to the type
    it('should have values assignable to AllowedModelOverrideKey type', () => {
      const sampleKey: AllowedModelOverrideKey = ALLOWED_MODEL_OVERRIDE_KEYS[0];
      expect(typeof sampleKey).toBe('string');
    });
  });

  describe('ALLOWED_MODEL_OVERRIDE_KEY_SET', () => {
    it('should be a ReadonlySet', () => {
      expect(ALLOWED_MODEL_OVERRIDE_KEY_SET instanceof Set).toBe(true);
    });

    it('should contain all keys from ALLOWED_MODEL_OVERRIDE_KEYS', () => {
      ALLOWED_MODEL_OVERRIDE_KEYS.forEach((key: string) => {
        expect(ALLOWED_MODEL_OVERRIDE_KEY_SET.has(key)).toBe(true);
      });
    });

    it('should have the same size as ALLOWED_MODEL_OVERRIDE_KEYS array', () => {
      expect(ALLOWED_MODEL_OVERRIDE_KEY_SET.size).toBe(ALLOWED_MODEL_OVERRIDE_KEYS.length);
    });

    it('should not contain unexpected keys', () => {
      expect(ALLOWED_MODEL_OVERRIDE_KEY_SET.has('invalid_key')).toBe(false);
      expect(ALLOWED_MODEL_OVERRIDE_KEY_SET.has('nonexistent')).toBe(false);
    });

    it('should return boolean values for has method', () => {
      expect(typeof ALLOWED_MODEL_OVERRIDE_KEY_SET.has('id')).toBe('boolean');
      expect(typeof ALLOWED_MODEL_OVERRIDE_KEY_SET.has('invalid')).toBe('boolean');
    });
  });

  describe('consistency between array and set', () => {
    it('should have identical contents between array and set', () => {
      const keysFromSet = Array.from(ALLOWED_MODEL_OVERRIDE_KEY_SET);
      const sortedArrayKeys = [...ALLOWED_MODEL_OVERRIDE_KEYS].sort();
      const sortedSetKeys = keysFromSet.sort();

      expect(sortedArrayKeys).toEqual(sortedSetKeys);
    });

    it('should maintain same count between array and set', () => {
      expect(ALLOWED_MODEL_OVERRIDE_KEYS.length).toBe(ALLOWED_MODEL_OVERRIDE_KEY_SET.size);
    });
  });

  describe('AllowedModelOverrideKey type', () => {
    it('should allow all defined keys to be assigned to the type', () => {
      // Test a few representative keys to ensure type safety
      const idKey: AllowedModelOverrideKey = 'id';
      const nameKey: AllowedModelOverrideKey = 'name';
      const temperatureKey: AllowedModelOverrideKey = 'temperature';
      const currencyKey: AllowedModelOverrideKey = 'currency';

      expect(idKey).toBe('id');
      expect(nameKey).toBe('name');
      expect(temperatureKey).toBe('temperature');
      expect(currencyKey).toBe('currency');
    });

    it('should have correct union type members', () => {
      // Verify that the type correctly represents the union of all possible keys
      const allKeys = ALLOWED_MODEL_OVERRIDE_KEYS;
      allKeys.forEach((key: string) => {
        // This assignment should be valid according to the type definition
        const typedKey: AllowedModelOverrideKey = key as AllowedModelOverrideKey;
        expect(typedKey).toBe(key);
      });
    });
  });
});