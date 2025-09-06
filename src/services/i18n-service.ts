import { join } from 'node:path';

import type { ApiI18nMessages, I18nConfig, I18nLocaleConfig } from '../types/index.js';
import { readJSONIfExists } from '../utils/file-utils.js';

const DEFAULT_LOCALES: I18nLocaleConfig[] = [
  { locale: 'en', name: 'English', default: true, site_name: 'LLM Metadata' },
  { locale: 'zh', name: '简体中文', site_name: 'LLM 元数据' },
];

/** i18n 配置加载服务 */
export class I18nService {
  private readonly i18nDir: string;

  constructor(private readonly rootDir: string) {
    this.i18nDir = join(this.rootDir, 'i18n');
  }

  /** 读取 locales 配置，若不存在则返回默认 */
  getLocales(): I18nLocaleConfig[] {
    const configPath = join(this.i18nDir, 'locales.json');
    const config = readJSONIfExists<I18nConfig>(configPath);
    const locales = config?.locales?.length ? config.locales : DEFAULT_LOCALES;

    // 保证仅一个默认语言
    let seenDefault = false;
    return locales.map((l) => {
      if (l.default && !seenDefault) {
        seenDefault = true;
        return l;
      }
      return { ...l, default: false };
    });
  }

  /** 获取文档词条（按 locale，自动合并英文作为兜底） */
  getDocMessages(locale: string): Record<string, string> {
    const en =
      readJSONIfExists<Record<string, string>>(join(this.i18nDir, 'docs', 'en.json')) || {};
    if (!locale || locale === 'en') return en;
    const loc =
      readJSONIfExists<Record<string, string>>(join(this.i18nDir, 'docs', `${locale}.json`)) || {};
    return { ...en, ...loc };
  }

  /** 获取用于日期格式化的区域字符串 */
  getDateLocale(locale: string): string {
    if (!locale) return 'en-US';
    if (locale.includes('-')) return locale;
    const base = locale.toLowerCase();
    if (base.startsWith('zh')) return 'zh-CN';
    if (base.startsWith('ja')) return 'ja-JP';
    if (base.startsWith('en')) return 'en-US';
    return 'en-US';
  }

  /**
   * 获取用于日期显示的 IANA 时区
   * 优先读取 i18n/locales.json 中每个 locale 的 timeZone 字段；
   * 若未配置，则按常见语言提供一个合理默认；
   * 最终兜底使用 'UTC'。
   */
  getTimeZone(locale: string): string {
    // 尝试从配置获取
    try {
      const configPath = join(this.i18nDir, 'locales.json');
      const config = readJSONIfExists<I18nConfig>(configPath);
      const configured = config?.locales?.find((l) => l.locale === locale)?.timeZone;
      if (configured) return configured;
    } catch {
      // ignore
    }

    // 语言推断
    const base = (locale || 'en').toLowerCase();
    if (base.startsWith('zh')) return 'Asia/Shanghai';
    if (base.startsWith('ja')) return 'Asia/Tokyo';
    if (base.startsWith('en')) return 'America/Los_Angeles';

    return 'UTC';
  }

  /** 校验 i18n/docs 下各语言词条的完整性（与英文对齐），返回警告列表 */
  validateDocMessages(locales: string[]): string[] {
    const warnings: string[] = [];
    const en =
      readJSONIfExists<Record<string, string>>(join(this.i18nDir, 'docs', 'en.json')) || {};
    const requiredKeys = new Set(Object.keys(en));

    for (const locale of locales) {
      if (locale === 'en') continue;
      const raw =
        readJSONIfExists<Record<string, string>>(join(this.i18nDir, 'docs', `${locale}.json`)) ||
        {};
      const missing: string[] = [];
      for (const key of requiredKeys) {
        if (!(key in raw)) missing.push(key);
      }
      if (missing.length > 0) {
        warnings.push(`i18n.docs[${locale}] missing ${missing.length} keys: ${missing.join(', ')}`);
      }
    }

    return warnings;
  }

  /** 获取 API i18n 词典（按 locale，英文兜底） */
  getApiMessages(locale: string): ApiI18nMessages {
    const en = readJSONIfExists<ApiI18nMessages>(join(this.i18nDir, 'api', 'en.json')) || {};
    if (!locale || locale === 'en') return en;
    const loc =
      readJSONIfExists<ApiI18nMessages>(join(this.i18nDir, 'api', `${locale}.json`)) || {};
    return { ...en, ...loc };
  }
}
