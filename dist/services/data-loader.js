import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { ALLOWED_MODEL_OVERRIDE_KEY_SET } from '../constants/override-keys.js';
import { readJSONIfExists } from '../utils/file-utils.js';
import { isRecord } from '../utils/object-utils.js';
/** 目录中直接子级的 .json 文件：文件名（不含扩展名）→ 解析后的对象；非法 JSON 或非对象内容警告并跳过 */
function readJsonObjects(dir) {
    const out = new Map();
    if (!existsSync(dir))
        return out;
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (extname(name) !== '.json' || !statSync(full).isFile())
            continue;
        const value = readJSONIfExists(full);
        if (isRecord(value))
            out.set(basename(name, '.json'), value);
        else
            console.warn(`Ignoring ${full}: not a valid JSON object`);
    }
    return out;
}
/** 两级目录 <dir>/<provider>/<model>.json → "provider/model" 键 */
function readNestedJsonObjects(dir) {
    const out = new Map();
    if (!existsSync(dir))
        return out;
    for (const provider of readdirSync(dir)) {
        const providerDir = join(dir, provider);
        if (!statSync(providerDir).isDirectory())
            continue;
        for (const [model, value] of readJsonObjects(providerDir)) {
            out.set(`${provider}/${model}`, value);
        }
    }
    return out;
}
/** 模型覆写仅保留白名单字段（$comment 等维护备注被丢弃） */
function sanitizeModelOverride(value) {
    return Object.fromEntries(Object.entries(value).filter(([key]) => ALLOWED_MODEL_OVERRIDE_KEY_SET.has(key)));
}
/** i18n 覆写仅保留 name / description 下的字符串文案 */
function sanitizeI18nEntity(value) {
    const textMap = (field) => {
        if (!isRecord(field))
            return undefined;
        const entries = Object.entries(field).filter((entry) => typeof entry[1] === 'string');
        return entries.length > 0 ? Object.fromEntries(entries) : undefined;
    };
    const name = textMap(value.name);
    const description = textMap(value.description);
    return { ...(name && { name }), ...(description && { description }) };
}
/** 数据加载服务 */
export class DataLoader {
    dataDir;
    cacheDir;
    constructor(dataDir, cacheDir) {
        this.dataDir = dataDir;
        this.cacheDir = cacheDir;
    }
    /** 从网络或缓存加载源数据 */
    async loadSourceData(sourceUrl) {
        try {
            const response = await fetch(sourceUrl, {
                headers: { accept: 'application/json' },
            });
            if (!response.ok) {
                throw new Error(`Fetch failed ${response.status} ${sourceUrl}`);
            }
            return response.json();
        }
        catch (error) {
            // 网络失败时尝试使用缓存
            const cachePath = join(this.cacheDir, 'api.json');
            if (existsSync(cachePath)) {
                console.warn('Network failed, using cached data:', error);
                return this.readJSONSafe(cachePath, {});
            }
            throw error;
        }
    }
    /** 安全读取 JSON 文件 */
    readJSONSafe(filePath, defaultValue) {
        try {
            if (!existsSync(filePath)) {
                return defaultValue;
            }
            const content = readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        }
        catch (error) {
            console.warn(`Failed to read ${filePath}:`, error);
            return defaultValue;
        }
    }
    /** 加载策略配置 */
    loadPolicy() {
        const policyPath = join(this.dataDir, 'policy.json');
        return this.readJSONSafe(policyPath, { providers: {}, models: {} });
    }
    /** 加载原生供应商目录（缺失时返回 null，构建将跳过过滤） */
    loadNativeProviders() {
        const configPath = join(this.dataDir, 'native-providers.json');
        const config = this.readJSONSafe(configPath, null);
        if (!config || typeof config !== 'object' || typeof config.providers !== 'object') {
            return null;
        }
        return config;
    }
    /**
     * 加载目录化覆写（data/overrides/**）。每个文件对应唯一键：
     * providers/<provider>.json、models/<provider>/<model>.json，
     * i18n/providers/<provider>.json、i18n/models/<provider>/<model>.json。
     */
    loadOverrides() {
        const root = join(this.dataDir, 'overrides');
        const providers = {};
        for (const [id, value] of readJsonObjects(join(root, 'providers'))) {
            providers[id] = value;
        }
        const models = {};
        for (const [key, value] of readNestedJsonObjects(join(root, 'models'))) {
            models[key] = sanitizeModelOverride(value);
        }
        const i18nProviders = {};
        for (const [id, value] of readJsonObjects(join(root, 'i18n', 'providers'))) {
            i18nProviders[id] = sanitizeI18nEntity(value);
        }
        const i18nModels = {};
        for (const [key, value] of readNestedJsonObjects(join(root, 'i18n', 'models'))) {
            i18nModels[key] = sanitizeI18nEntity(value);
        }
        return { providers, models, i18n: { providers: i18nProviders, models: i18nModels } };
    }
}
//# sourceMappingURL=data-loader.js.map