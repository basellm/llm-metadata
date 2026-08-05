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

  /** 获取 API i18n 词典（按 locale，英文兜底） */
  getApiMessages(locale: string): ApiI18nMessages {
    const en = readJSONIfExists<ApiI18nMessages>(join(this.i18nDir, 'api', 'en.json')) || {};
    if (!locale || locale === 'en') return en;
    const loc =
      readJSONIfExists<ApiI18nMessages>(join(this.i18nDir, 'api', `${locale}.json`)) || {};
    return { ...en, ...loc };
  }
}
