import type { ApiI18nMessages, I18nLocaleConfig } from '../types/index.js';
/** i18n 配置加载服务 */
export declare class I18nService {
    private readonly rootDir;
    private readonly i18nDir;
    constructor(rootDir: string);
    /** 读取 locales 配置，若不存在则返回默认 */
    getLocales(): I18nLocaleConfig[];
    /** 获取 API i18n 词典（按 locale，英文兜底） */
    getApiMessages(locale: string): ApiI18nMessages;
}
//# sourceMappingURL=i18n-service.d.ts.map