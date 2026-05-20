import fs from 'node:fs';
import path from 'node:path';
import { jest, describe, it, beforeEach, expect } from '@jest/globals';

import { DataLoader } from './data-loader.js';
import type { SourceData, PolicyConfig } from '../types/index.js';

// Mock the fetch API
global.fetch = jest.fn() as jest.MockedFunction<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>;

describe('DataLoader', () => {
  const mockDataDir = '/mock/data';
  const mockCacheDir = '/mock/cache';
  let dataLoader: DataLoader;

  beforeEach(() => {
    dataLoader = new DataLoader(mockDataDir, mockCacheDir);
    jest.clearAllMocks();
  });

  describe('loadSourceData', () => {
    it('should fetch data from URL when successful', async () => {
      const mockSourceData: SourceData = {
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

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSourceData),
      } as Response);

      const result = await dataLoader.loadSourceData('https://api.example.com/data');

      expect(result).toEqual(mockSourceData);
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/data', {
        headers: { accept: 'application/json' },
      });
    });

    it('should fall back to cache when fetch fails and cache exists', async () => {
      const mockCacheData: SourceData = {
        'cached-provider': {
          id: 'cached-provider',
          name: 'Cached Provider',
          models: {
            'cached-model': {
              id: 'cached-model',
              name: 'Cached Model',
            },
          },
        },
      };
      const cachePath = path.join(mockCacheDir, 'api.json');

      // Mock fetch failure
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error'),
      );

      // Mock file system to simulate cache file exists
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockCacheData));

      // Mock console.warn to prevent spurious logs during testing
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await dataLoader.loadSourceData('https://api.example.com/data');

      expect(result).toEqual(mockCacheData);
      expect(fs.existsSync).toHaveBeenCalledWith(cachePath);
      expect(fs.readFileSync).toHaveBeenCalledWith(cachePath, 'utf8');

      // Verify that console.warn was called as expected
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should throw error when fetch fails and cache does not exist', async () => {
      // Mock fetch failure
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error'),
      );

      // Mock file system to simulate cache file does not exist
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(dataLoader.loadSourceData('https://api.example.com/data')).rejects.toThrow(
        'Network error',
      );
    });

    it('should throw error when fetch returns non-ok response', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(dataLoader.loadSourceData('https://api.example.com/data')).rejects.toThrow(
        'Fetch failed 404 https://api.example.com/data',
      );
    });
  });

  describe('readJSONSafe', () => {
    it('should return default value when file does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const defaultValue = { providers: {}, models: {} };
      const result = dataLoader.readJSONSafe('/nonexistent/file.json', defaultValue);

      expect(result).toEqual(defaultValue);
      expect(fs.existsSync).toHaveBeenCalledWith('/nonexistent/file.json');
    });

    it('should return parsed JSON when file exists', () => {
      const mockContent = { key: 'value', nested: { prop: 'data' } };
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockContent));

      const defaultValue = { providers: {}, models: {} };
      const result = dataLoader.readJSONSafe('/existing/file.json', defaultValue);

      expect(result).toEqual(mockContent);
      expect(fs.readFileSync).toHaveBeenCalledWith('/existing/file.json', 'utf8');
    });

    it('should return default value when JSON parsing fails', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('{ invalid json');

      // Mock console.warn to prevent spurious logs during testing
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const defaultValue = { providers: {}, models: {} };
      const result = dataLoader.readJSONSafe('/invalid/json.json', defaultValue);

      expect(result).toEqual(defaultValue);

      // Verify that console.warn was called as expected
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });
  });

  describe('loadPolicy', () => {
    it('should load policy from policy.json file', () => {
      const mockPolicy: PolicyConfig = {
        providers: { 'provider-1': { auto: true } },
        models: { 'model-1': { auto: false } },
      };
      const policyPath = path.join(mockDataDir, 'policy.json');

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockPolicy));

      const result = dataLoader.loadPolicy();

      expect(result).toEqual(mockPolicy);
      expect(fs.existsSync).toHaveBeenCalledWith(policyPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(policyPath, 'utf8');
    });

    it('should return default policy when policy file does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = dataLoader.loadPolicy();

      expect(result).toEqual({ providers: {}, models: {} });
    });
  });

  describe('loadOverrides', () => {
    it('should return default overrides when overrides directory does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = dataLoader.loadOverrides();

      expect(result).toEqual({
        providers: {},
        models: {},
        i18n: { providers: {}, models: {} },
      });
    });

    // Note: Testing the detailed override logic is challenging with mocking,
    // as it involves complex interactions between file system methods.
    // More comprehensive testing would require actual test files in a temp directory.
  });
});