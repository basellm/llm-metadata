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
    /** 获取文档词条（按 locale，自动合并英文作为兜底） */
    getDocMessages(locale) {
        const en = readJSONIfExists(join(this.i18nDir, 'docs', 'en.json')) || {};
        if (!locale || locale === 'en')
            return en;
        const loc = readJSONIfExists(join(this.i18nDir, 'docs', `${locale}.json`)) || {};
        return { ...en, ...loc };
    }
    /** 获取用于日期格式化的区域字符串 */
    getDateLocale(locale) {
        if (!locale)
            return 'en-US';
        if (locale.includes('-'))
            return locale;
        const base = locale.toLowerCase();
        if (base.startsWith('zh'))
            return 'zh-CN';
        if (base.startsWith('ja'))
            return 'ja-JP';
        if (base.startsWith('en'))
            return 'en-US';
        return 'en-US';
    }
    /**
     * 获取用于日期显示的 IANA 时区
     * 优先读取 i18n/locales.json 中每个 locale 的 timeZone 字段；
     * 若未配置，则按常见语言提供一个合理默认；
     * 最终兜底使用 'UTC'。
     */
    getTimeZone(locale) {
        // 尝试从配置获取
        try {
            const configPath = join(this.i18nDir, 'locales.json');
            const config = readJSONIfExists(configPath);
            const configured = config?.locales?.find((l) => l.locale === locale)?.timeZone;
            if (configured)
                return configured;
        }
        catch {
            // ignore
        }
        // 语言推断
        const base = (locale || 'en').toLowerCase();
        if (base.startsWith('zh'))
            return 'Asia/Shanghai';
        if (base.startsWith('ja'))
            return 'Asia/Tokyo';
        if (base.startsWith('en'))
            return 'America/Los_Angeles';
        return 'UTC';
    }
    /** 校验 i18n/docs 下各语言词条的完整性（与英文对齐），返回警告列表 */
    validateDocMessages(locales) {
        const warnings = [];
        const en = readJSONIfExists(join(this.i18nDir, 'docs', 'en.json')) || {};
        const requiredKeys = new Set(Object.keys(en));
        for (const locale of locales) {
            if (locale === 'en')
                continue;
            const raw = readJSONIfExists(join(this.i18nDir, 'docs', `${locale}.json`)) ||
                {};
            const missing = [];
            for (const key of requiredKeys) {
                if (!(key in raw))
                    missing.push(key);
            }
            if (missing.length > 0) {
                warnings.push(`i18n.docs[${locale}] missing ${missing.length} keys: ${missing.join(', ')}`);
            }
        }
        return warnings;
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