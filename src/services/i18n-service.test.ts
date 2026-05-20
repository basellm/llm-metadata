import { join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

import { I18nService } from './i18n-service.js';

// We only need the basic Jest global types for compilation
declare const describe: (title: string, fn: () => void) => void;
declare const it: (title: string, fn: () => void) => void;
declare const expect: (actual: any) => any;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;

describe('I18nService', () => {
  const testRootDir = join(process.cwd(), 'test-i18n-root');
  let service: I18nService;

  beforeEach(() => {
    service = new I18nService(testRootDir);
    // Clean up test directory before each test
    try {
      rmSync(join(testRootDir, 'i18n'), { recursive: true, force: true });
    } catch (e) {
      // Ignore if directory doesn't exist
    }
  });

  afterEach(() => {
    // Clean up test directory after each test
    try {
      rmSync(join(testRootDir, 'i18n'), { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should initialize with correct i18n directory path', () => {
      expect(service).toBeDefined();
      // @ts-expect-error accessing private property for testing
      expect(service.rootDir).toBe(testRootDir);
      // @ts-expect-error accessing private property for testing
      expect(service.i18nDir).toBe(join(testRootDir, 'i18n'));
    });
  });

  describe('getLocales', () => {
    it('should return default locales when locales.json does not exist', () => {
      const locales = service.getLocales();
      expect(locales).toHaveLength(2);
      expect(locales[0]).toEqual({
        locale: 'en',
        name: 'English',
        default: true,
        site_name: 'LLM Metadata'
      });
      expect(locales[1]).toEqual({
        locale: 'zh',
        name: '简体中文',
        default: false, // Only the first should be default
        site_name: 'LLM 元数据'
      });
    });

    it('should return configured locales when locales.json exists', () => {
      const i18nDir = join(testRootDir, 'i18n');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'locales.json'),
        JSON.stringify({
          locales: [
            { locale: 'fr', name: 'Français', default: true, site_name: 'Métadonnées LLM' },
            { locale: 'de', name: 'Deutsch', default: false, site_name: 'LLM Metadaten' }
          ]
        })
      );

      const locales = service.getLocales();
      expect(locales).toHaveLength(2);
      expect(locales[0]).toEqual({
        locale: 'fr',
        name: 'Français',
        default: true,
        site_name: 'Métadonnées LLM'
      });
      expect(locales[1]).toEqual({
        locale: 'de',
        name: 'Deutsch',
        default: false,
        site_name: 'LLM Metadaten'
      });
    });

    it('should ensure only one locale is marked as default when multiple defaults exist in config', () => {
      const i18nDir = join(testRootDir, 'i18n');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'locales.json'),
        JSON.stringify({
          locales: [
            { locale: 'fr', name: 'Français', default: true, site_name: 'Métadonnées LLM' },
            { locale: 'de', name: 'Deutsch', default: true, site_name: 'LLM Metadaten' }, // duplicate default
            { locale: 'es', name: 'Español', default: false, site_name: 'Metadatos LLM' }
          ]
        })
      );

      const locales = service.getLocales();
      expect(locales).toHaveLength(3);
      // Only first should be default
      expect(locales[0].default).toBe(true);
      expect(locales[1].default).toBe(false); // Changed from true to false
      expect(locales[2].default).toBe(false);
    });
  });

  describe('getDocMessages', () => {
    it('should return empty object when i18n directory does not exist', () => {
      const messages = service.getDocMessages('en');
      expect(messages).toEqual({});
    });

    it('should return English messages when locale is "en"', () => {
      const i18nDir = join(testRootDir, 'i18n', 'docs');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({ greeting: 'Hello', farewell: 'Goodbye' })
      );
      writeFileSync(
        join(i18nDir, 'zh.json'),
        JSON.stringify({ greeting: '你好' }) // Missing farewell
      );

      const messages = service.getDocMessages('en');
      expect(messages).toEqual({ greeting: 'Hello', farewell: 'Goodbye' });
    });

    it('should return English as fallback for other locales', () => {
      const i18nDir = join(testRootDir, 'i18n', 'docs');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({ greeting: 'Hello', farewell: 'Goodbye' })
      );
      writeFileSync(
        join(i18nDir, 'zh.json'),
        JSON.stringify({ greeting: '你好' }) // Missing farewell
      );

      const messages = service.getDocMessages('zh');
      expect(messages).toEqual({
        greeting: '你好', // From zh.json
        farewell: 'Goodbye' // Fallback from en.json
      });
    });

    it('should return English fallback when locale file does not exist', () => {
      const i18nDir = join(testRootDir, 'i18n', 'docs');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({ greeting: 'Hello', farewell: 'Goodbye' })
      );

      const messages = service.getDocMessages('fr'); // fr.json does not exist
      expect(messages).toEqual({ greeting: 'Hello', farewell: 'Goodbye' });
    });

    it('should return empty object when both locale and English files do not exist', () => {
      const messages = service.getDocMessages('fr');
      expect(messages).toEqual({});
    });

    it('should return empty object when locale is falsy', () => {
      const messages = service.getDocMessages('');
      expect(messages).toEqual({});
    });
  });

  describe('getDateLocale', () => {
    it('should return "en-US" when locale is falsy', () => {
      expect(service.getDateLocale('')).toBe('en-US');
      expect(service.getDateLocale(undefined as any)).toBe('en-US');
    });

    it('should return locale as-is when it contains a hyphen', () => {
      expect(service.getDateLocale('en-US')).toBe('en-US');
      expect(service.getDateLocale('zh-CN')).toBe('zh-CN');
      expect(service.getDateLocale('pt-BR')).toBe('pt-BR');
    });

    it('should map Chinese base locale to zh-CN', () => {
      expect(service.getDateLocale('zh')).toBe('zh-CN');
      expect(service.getDateLocale('ZH')).toBe('zh-CN');
      expect(service.getDateLocale('Zh')).toBe('zh-CN');
    });

    it('should map Japanese base locale to ja-JP', () => {
      expect(service.getDateLocale('ja')).toBe('ja-JP');
      expect(service.getDateLocale('JA')).toBe('ja-JP');
      expect(service.getDateLocale('Ja')).toBe('ja-JP');
    });

    it('should map English base locale to en-US', () => {
      expect(service.getDateLocale('en')).toBe('en-US');
      expect(service.getDateLocale('EN')).toBe('en-US');
      expect(service.getDateLocale('En')).toBe('en-US');
    });

    it('should return "en-US" for unknown base locales', () => {
      expect(service.getDateLocale('fr')).toBe('en-US');
      expect(service.getDateLocale('de')).toBe('en-US');
      expect(service.getDateLocale('ru')).toBe('en-US');
    });
  });

  describe('getTimeZone', () => {
    it('should return "Asia/Shanghai" for Chinese locales', () => {
      expect(service.getTimeZone('zh')).toBe('Asia/Shanghai');
      expect(service.getTimeZone('ZH')).toBe('Asia/Shanghai');
      expect(service.getTimeZone('Zh')).toBe('Asia/Shanghai');
      expect(service.getTimeZone('zh-TW')).toBe('Asia/Shanghai');
    });

    it('should return "Asia/Tokyo" for Japanese locales', () => {
      expect(service.getTimeZone('ja')).toBe('Asia/Tokyo');
      expect(service.getTimeZone('JA')).toBe('Asia/Tokyo');
      expect(service.getTimeZone('Ja')).toBe('Asia/Tokyo');
      expect(service.getTimeZone('ja-JP')).toBe('Asia/Tokyo');
    });

    it('should return "America/Los_Angeles" for English locales', () => {
      expect(service.getTimeZone('en')).toBe('America/Los_Angeles');
      expect(service.getTimeZone('EN')).toBe('America/Los_Angeles');
      expect(service.getTimeZone('En')).toBe('America/Los_Angeles');
      expect(service.getTimeZone('en-US')).toBe('America/Los_Angeles');
    });

    it('should return "UTC" for unknown locales', () => {
      expect(service.getTimeZone('fr')).toBe('UTC');
      expect(service.getTimeZone('de')).toBe('UTC');
      expect(service.getTimeZone('ru')).toBe('UTC');
    });

    it('should return "America/Los_Angeles" when locale is empty string or null (due to base fallback)', () => {
      expect(service.getTimeZone('')).toBe('America/Los_Angeles');
      expect(service.getTimeZone(null as any)).toBe('America/Los_Angeles');
    });

    it('should return configured timezone from locales.json if available', () => {
      const i18nDir = join(testRootDir, 'i18n');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'locales.json'),
        JSON.stringify({
          locales: [
            { locale: 'fr', name: 'Français', timeZone: 'Europe/Paris' },
            { locale: 'de', name: 'Deutsch', timeZone: 'Europe/Berlin' }
          ]
        })
      );

      expect(service.getTimeZone('fr')).toBe('Europe/Paris');
      expect(service.getTimeZone('de')).toBe('Europe/Berlin');
    });

    it('should still fall back to language detection when locale not in config', () => {
      const i18nDir = join(testRootDir, 'i18n');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'locales.json'),
        JSON.stringify({
          locales: [
            { locale: 'fr', name: 'Français', timeZone: 'Europe/Paris' }
          ]
        })
      );

      // zh should still fall back to language detection since it's not in the config
      expect(service.getTimeZone('zh')).toBe('Asia/Shanghai');
    });

    it('should prefer configured timezone over language detection', () => {
      const i18nDir = join(testRootDir, 'i18n');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'locales.json'),
        JSON.stringify({
          locales: [
            { locale: 'zh', name: '中文', timeZone: 'Asia/Tokyo' } // Override default behavior
          ]
        })
      );

      // Even though zh normally maps to Asia/Shanghai, config specifies Tokyo
      expect(service.getTimeZone('zh')).toBe('Asia/Tokyo');
    });
  });

  describe('validateDocMessages', () => {
    it('should return empty array when no locales are provided', () => {
      const warnings = service.validateDocMessages([]);
      expect(warnings).toEqual([]);
    });

    it('should return empty array when only English locale is provided', () => {
      const i18nDir = join(testRootDir, 'i18n', 'docs');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({ greeting: 'Hello', farewell: 'Goodbye' })
      );

      const warnings = service.validateDocMessages(['en']);
      expect(warnings).toEqual([]);
    });

    it('should return warnings for missing keys in non-English locales', () => {
      const i18nDir = join(testRootDir, 'i18n', 'docs');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({ greeting: 'Hello', farewell: 'Goodbye', welcome: 'Welcome' })
      );
      writeFileSync(
        join(i18nDir, 'zh.json'),
        JSON.stringify({ greeting: '你好', welcome: '欢迎' }) // Missing farewell
      );

      const warnings = service.validateDocMessages(['zh']);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('i18n.docs[zh] missing 1 keys:');
      expect(warnings[0]).toContain('farewell');
    });

    it('should handle multiple missing keys in validation', () => {
      const i18nDir = join(testRootDir, 'i18n', 'docs');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({ greeting: 'Hello', farewell: 'Goodbye', welcome: 'Welcome', goodbye: 'Bye' })
      );
      writeFileSync(
        join(i18nDir, 'zh.json'),
        JSON.stringify({ greeting: '你好' }) // Missing farewell, welcome, goodbye
      );

      const warnings = service.validateDocMessages(['zh']);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('i18n.docs[zh] missing 3 keys:');
      expect(warnings[0]).toContain('farewell');
      expect(warnings[0]).toContain('welcome');
      expect(warnings[0]).toContain('goodbye');
    });

    it('should not warn when locale has all required keys', () => {
      const i18nDir = join(testRootDir, 'i18n', 'docs');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({ greeting: 'Hello', farewell: 'Goodbye' })
      );
      writeFileSync(
        join(i18nDir, 'zh.json'),
        JSON.stringify({ greeting: '你好', farewell: '再见' })
      );

      const warnings = service.validateDocMessages(['zh']);
      expect(warnings).toEqual([]);
    });

    it('should return empty warnings when i18n/docs directory does not exist', () => {
      const warnings = service.validateDocMessages(['zh']);
      expect(warnings).toEqual([]);
    });

    it('should validate multiple locales', () => {
      const i18nDir = join(testRootDir, 'i18n', 'docs');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({ greeting: 'Hello', farewell: 'Goodbye', welcome: 'Welcome' })
      );
      writeFileSync(
        join(i18nDir, 'zh.json'),
        JSON.stringify({ greeting: '你好' }) // Missing farewell and welcome
      );
      writeFileSync(
        join(i18nDir, 'ja.json'),
        JSON.stringify({ farewell: 'さようなら' }) // Missing greeting and welcome
      );

      const warnings = service.validateDocMessages(['zh', 'ja']);
      expect(warnings).toHaveLength(2);
      expect(warnings.some(w => w.includes('[zh]'))).toBe(true);
      expect(warnings.some(w => w.includes('[ja]'))).toBe(true);
    });
  });

  describe('getApiMessages', () => {
    it('should return empty object when i18n/api directory does not exist', () => {
      const messages = service.getApiMessages('en');
      expect(messages).toEqual({});
    });

    it('should return English API messages when locale is "en"', () => {
      const i18nDir = join(testRootDir, 'i18n', 'api');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({
          capability_labels: { tools: 'Tools', files: 'Files' },
          defaults: { model_description: 'Default description' }
        })
      );
      writeFileSync(
        join(i18nDir, 'zh.json'),
        JSON.stringify({
          capability_labels: { tools: '工具' } // Missing files
        })
      );

      const messages = service.getApiMessages('en');
      expect(messages).toEqual({
        capability_labels: { tools: 'Tools', files: 'Files' },
        defaults: { model_description: 'Default description' }
      });
    });

    it('should return combined English + locale API messages for non-English locale (shallow merge)', () => {
      const i18nDir = join(testRootDir, 'i18n', 'api');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({
          capability_labels: { tools: 'Tools', files: 'Files' },
          defaults: { model_description: 'Default description' }
        })
      );
      writeFileSync(
        join(i18nDir, 'zh.json'),
        JSON.stringify({
          capability_labels: { tools: '工具' } // Replaces entire capability_labels object
        })
      );

      const messages = service.getApiMessages('zh');
      expect(messages).toEqual({
        capability_labels: { tools: '工具' }, // Locale completely replaces the object
        defaults: { model_description: 'Default description' }
      });
    });

    it('should return English fallback when locale API file does not exist', () => {
      const i18nDir = join(testRootDir, 'i18n', 'api');
      mkdirSync(i18nDir, { recursive: true });
      writeFileSync(
        join(i18nDir, 'en.json'),
        JSON.stringify({
          capability_labels: { tools: 'Tools', files: 'Files' }
        })
      );

      const messages = service.getApiMessages('fr'); // fr.json does not exist
      expect(messages).toEqual({
        capability_labels: { tools: 'Tools', files: 'Files' }
      });
    });

    it('should return empty object when both locale and English API files do not exist', () => {
      const messages = service.getApiMessages('fr');
      expect(messages).toEqual({});
    });

    it('should return empty object when locale is falsy', () => {
      const messages = service.getApiMessages('');
      expect(messages).toEqual({});
    });
  });
});