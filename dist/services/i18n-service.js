import { join } from 'node:path';
import { readJSONIfExists } from '../utils/file-utils.js';
const DEFAULT_LOCALES = [
    { locale: 'en', name: 'English', default: true, site_name: 'LLM Metadata' },
    { locale: 'zh', name: '简体中文', site_name: 'LLM 元数据' },
];
/** i18n 配置加载服务 */
export class I18nService {
    rootDir;
    i18nDir;
    constructor(rootDir) {
        this.rootDir = rootDir;
        this.i18nDir = join(this.rootDir, 'i18n');
    }
    /** 读取 locales 配置，若不存在则返回默认 */
    getLocales() {
        const configPath = join(this.i18nDir, 'locales.json');
        const config = readJSONIfExists(configPath);
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
    getApiMessages(locale) {
        const en = readJSONIfExists(join(this.i18nDir, 'api', 'en.json')) || {};
        if (!locale || locale === 'en')
            return en;
        const loc = readJSONIfExists(join(this.i18nDir, 'api', `${locale}.json`)) || {};
        return { ...en, ...loc };
    }
}
//# sourceMappingURL=i18n-service.js.map