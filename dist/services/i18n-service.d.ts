import type { ApiI18nMessages, I18nLocaleConfig } from '../types/index.js';
/** 描述翻译记忆：英文原文 → 目标语言译文 */
export type DescriptionTranslations = Readonly<Record<string, string>>;
/** i18n 配置加载服务（文件读取结果按 locale 缓存，构建期间只读一次） */
export declare class I18nService {
    private readonly rootDir;
    private readonly i18nDir;
    private readonly messages;
    private readonly translations;
    constructor(rootDir: string);
    /** 读取 locales 配置，若不存在则返回默认 */
    getLocales(): I18nLocaleConfig[];
    /** 获取 API i18n 词典（按 locale，英文兜底） */
    getApiMessages(locale: string): ApiI18nMessages;
    /** 翻译记忆文件路径（i18n/descriptions/<locale>.json） */
    descriptionTranslationsPath(locale: string): string;
    /** 模型描述翻译记忆（英文与缺失文件均为空映射） */
    getDescriptionTranslations(locale: string): DescriptionTranslations;
}
//# sourceMappingURL=i18n-service.d.ts.map