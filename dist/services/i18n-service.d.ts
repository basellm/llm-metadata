import type { I18nLocaleConfig } from '../types/index.js';
/** i18n 配置加载服务 */
export declare class I18nService {
    private readonly rootDir;
    private readonly i18nDir;
    constructor(rootDir: string);
    /** 读取 locales 配置，若不存在则返回默认 */
    getLocales(): I18nLocaleConfig[];
    /** 获取文档词条（按 locale，自动合并英文作为兜底） */
    getDocMessages(locale: string): Record<string, string>;
    /** 获取用于日期格式化的区域字符串 */
    getDateLocale(locale: string): string;
    /** 校验 i18n/docs 下各语言词条的完整性（与英文对齐），返回警告列表 */
    validateDocMessages(locales: string[]): string[];
}
//# sourceMappingURL=i18n-service.d.ts.map