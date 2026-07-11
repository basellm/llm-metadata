import { deepMerge, stableStringify, sha256OfObject } from './object-utils.js';
import { describe, test, expect } from '@jest/globals';

describe('object-utils', () => {
  describe('deepMerge', () => {
    test('should merge two simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3 };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 3 });
      expect(result).not.toBe(target); // Should not mutate the original target
    });

    test('should handle properties not in source', () => {
      const target = { a: 1, b: 2, c: 3 };
      const source = { b: 4 }; // Only update b
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 4, c: 3 });
    });

    test('should deeply merge nested objects', () => {
      const target = { a: { x: 1, y: 2 }, b: { c: 'hello', d: 'world' } };
      const source = { a: { x: 10, y: 20 }, b: { c: 'updated', d: 'changed' } };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: { x: 10, y: 20 }, b: { c: 'updated', d: 'changed' } });
    });

    test('should handle arrays correctly (should not merge arrays deeply)', () => {
      const target = { a: [1, 2, 3], b: { c: 'hello' } };
      const source = { a: [4, 5], b: { c: 'world' } };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: [4, 5], b: { c: 'world' } });
    });

    test('should handle nullable values properly', () => {
      const target = { a: 1 as number | null, b: 2 };
      const source = { a: null };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: null, b: 2 });
    });

    test('should handle merging with empty objects', () => {
      const target = { a: 1, b: 2 };
      const source = {}; // Empty source
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).not.toBe(target);
    });

    test('should return a copy of target when source is empty', () => {
      const target = { a: 1, b: 2 };
      const source = {};
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).not.toBe(target);
    });

    test('should handle undefined values in source (property not provided)', () => {
      const target = { a: 1, b: 2 };
      const source = { }; // No b property provided at all
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 2 }); // Should preserve original value when property is not in source
    });
  });

  describe('stableStringify', () => {
    test('should produce the same string for objects with same content but different key order', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { c: 3, a: 1, b: 2 };

      const str1 = stableStringify(obj1);
      const str2 = stableStringify(obj2);

      expect(str1).toBe(str2);
    });

    test('should handle nested objects consistently', () => {
      const obj1 = { z: { y: { x: 1 } }, a: 2 };
      const obj2 = { a: 2, z: { y: { x: 1 } } };

      const str1 = stableStringify(obj1);
      const str2 = stableStringify(obj2);

      expect(str1).toBe(str2);
    });

    test('should handle arrays consistently', () => {
      const obj1 = { arr: [1, 2, { z: 3, a: 1 }] };
      const obj2 = { arr: [1, 2, { a: 1, z: 3 }] };

      const str1 = stableStringify(obj1);
      const str2 = stableStringify(obj2);

      expect(str1).toBe(str2);
    });

    test('should handle primitive values', () => {
      const obj = 42;
      const result = stableStringify(obj);

      expect(result).toBe('42');
    });

    test('should handle string values', () => {
      const obj = 'hello';
      const result = stableStringify(obj);

      expect(result).toBe('"hello"');
    });

    test('should sort keys at all levels', () => {
      const obj = { z: { m: { a: 1, z: 2 }, a: {} }, a: 1 };

      const result = stableStringify(obj);
      const expected = `{
  "a": 1,
  "z": {
    "a": {},
    "m": {
      "a": 1,
      "z": 2
    }
  }
}`;

      expect(result).toBe(expected);
    });
  });

  describe('sha256OfObject', () => {
    test('should generate consistent hash for same object', () => {
      const obj = { a: 1, b: 2, c: 3 };

      const hash1 = sha256OfObject(obj);
      const hash2 = sha256OfObject(obj);

      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      const hash1 = sha256OfObject(obj1);
      const hash2 = sha256OfObject(obj2);

      expect(hash1).not.toBe(hash2);
    });

    test('should generate same hash for objects with same content but different key order', () => {
      const obj1 = { c: 3, a: 1, b: 2 };
      const obj2 = { a: 1, b: 2, c: 3 };

      const hash1 = sha256OfObject(obj1);
      const hash2 = sha256OfObject(obj2);

      expect(hash1).toBe(hash2);
    });

    test('should generate appropriate length hex string', () => {
      const obj = { a: 1, b: 'hello', c: { nested: true } };
      const hash = sha256OfObject(obj);

      // SHA256 produces a 64-character hex string
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    test('should work with nested objects', () => {
      const obj = { a: { x: { m: 1, n: 2 } }, b: [1, 2, 3] };
      const hash = sha256OfObject(obj);

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    test('should handle arrays correctly', () => {
      const obj = { arr: [3, 1, 2] }; // Order matters for arrays
      const hash = sha256OfObject(obj);

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });
});