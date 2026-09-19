import { join } from 'node:path';

import type { ApiI18nMessages, I18nConfig, I18nLocaleConfig } from '../types/index.js';
import { readJSONIfExists } from '../utils/file-utils.js';

const DEFAULT_LOCALES: I18nLocaleConfig[] = [
  { locale: 'en', name: 'English', default: true, site_name: 'LLM Metadata' },
  { locale: 'zh', name: '简体中文', site_name: 'LLM 元数据' },
];

/** 描述翻译记忆：英文原文 → 目标语言译文 */
export type DescriptionTranslations = Readonly<Record<string, string>>;

/** i18n 配置加载服务（文件读取结果按 locale 缓存，构建期间只读一次） */
export class I18nService {
  private readonly i18nDir: string;
  private readonly messages = new Map<string, ApiI18nMessages>();
  private readonly translations = new Map<string, DescriptionTranslations>();

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
    const key = locale || 'en';
    let messages = this.messages.get(key);
    if (!messages) {
      const en = readJSONIfExists<ApiI18nMessages>(join(this.i18nDir, 'api', 'en.json')) || {};
      messages =
        key === 'en'
          ? en
          : {
              ...en,
              ...(readJSONIfExists<ApiI18nMessages>(join(this.i18nDir, 'api', `${key}.json`)) ||
                {}),
            };
      this.messages.set(key, messages);
    }
    return messages;
  }

  /** 翻译记忆文件路径（i18n/descriptions/<locale>.json） */
  descriptionTranslationsPath(locale: string): string {
    return join(this.i18nDir, 'descriptions', `${locale}.json`);
  }

  /** 模型描述翻译记忆（英文与缺失文件均为空映射） */
  getDescriptionTranslations(locale: string): DescriptionTranslations {
    if (locale === 'en') return {};
    let translations = this.translations.get(locale);
    if (!translations) {
      translations =
        readJSONIfExists<Record<string, string>>(this.descriptionTranslationsPath(locale)) || {};
      this.translations.set(locale, translations);
    }
    return translations;
  }
}
