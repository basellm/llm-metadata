import { join } from 'node:path';
import { readJSONIfExists } from '../utils/file-utils.js';
const DEFAULT_LOCALES = [
    { locale: 'en', name: 'English', default: true, site_name: 'LLM Metadata' },
    { locale: 'zh', name: '简体中文', site_name: 'LLM 元数据' },
];
/** i18n 配置加载服务（文件读取结果按 locale 缓存，构建期间只读一次） */
export class I18nService {
    rootDir;
    i18nDir;
    messages = new Map();
    translations = new Map();
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
        const key = locale || 'en';
        let messages = this.messages.get(key);
        if (!messages) {
            const en = readJSONIfExists(join(this.i18nDir, 'api', 'en.json')) || {};
            messages =
                key === 'en'
                    ? en
                    : {
                        ...en,
                        ...(readJSONIfExists(join(this.i18nDir, 'api', `${key}.json`)) ||
                            {}),
                    };
            this.messages.set(key, messages);
        }
        return messages;
    }
    /** 翻译记忆文件路径（i18n/descriptions/<locale>.json） */
    descriptionTranslationsPath(locale) {
        return join(this.i18nDir, 'descriptions', `${locale}.json`);
    }
    /** 模型描述翻译记忆（英文与缺失文件均为空映射） */
    getDescriptionTranslations(locale) {
        if (locale === 'en')
            return {};
        let translations = this.translations.get(locale);
        if (!translations) {
            translations =
                readJSONIfExists(this.descriptionTranslationsPath(locale)) || {};
            this.translations.set(locale, translations);
        }
        return translations;
    }
}
//# sourceMappingURL=i18n-service.js.map