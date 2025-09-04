import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { deepMerge } from '../utils/object-utils.js';
import { ALLOWED_MODEL_OVERRIDE_KEY_SET } from '../constants/override-keys.js';
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
    /** 加载覆写配置 */
    loadOverrides() {
        // overrides.json is deprecated; start from an empty base and only read from overrides/ directory
        const base = {
            providers: {},
            models: {},
            i18n: { providers: {}, models: {} },
        };
        const folder = join(this.dataDir, 'overrides');
        if (!existsSync(folder))
            return base;
        const safeDeepMerge = (a, b) => deepMerge(a, b);
        const mergeProviderOverride = (providerId, override) => {
            base.providers = base.providers || {};
            base.providers[providerId] = safeDeepMerge(base.providers[providerId] || {}, override || {});
        };
        const mergeModelOverride = (providerId, modelId, override) => {
            const key = `${providerId}/${modelId}`;
            base.models = base.models || {};
            base.models[key] = safeDeepMerge(base.models[key] || {}, override || {});
        };
        const ensureI18n = () => {
            if (!base.i18n) {
                base.i18n = {
                    providers: {},
                    models: {},
                };
            }
            else {
                if (!base.i18n.providers)
                    base.i18n.providers = {};
                if (!base.i18n.models)
                    base.i18n.models = {};
            }
            return base.i18n;
        };
        const mergeProviderI18n = (providerId, override) => {
            const i18n = ensureI18n();
            i18n.providers[providerId] = safeDeepMerge(i18n.providers[providerId] || {}, override || {});
        };
        const mergeModelI18n = (providerId, modelId, override) => {
            const i18n = ensureI18n();
            const key = `${providerId}/${modelId}`;
            i18n.models[key] = safeDeepMerge(i18n.models[key] || {}, override || {});
        };
        const readJSON = (p) => {
            try {
                const txt = readFileSync(p, 'utf8');
                return JSON.parse(txt);
            }
            catch {
                return undefined;
            }
        };
        const sanitizeModelOverride = (obj) => {
            if (!obj || typeof obj !== 'object')
                return {};
            const out = {};
            for (const k of Object.keys(obj)) {
                if (ALLOWED_MODEL_OVERRIDE_KEY_SET.has(k))
                    out[k] = obj[k];
            }
            return out;
        };
        const walk = (dir) => {
            if (!existsSync(dir))
                return [];
            const out = [];
            for (const name of readdirSync(dir)) {
                const full = join(dir, name);
                const st = statSync(full);
                if (st.isDirectory())
                    out.push(...walk(full));
                else if (st.isFile() && extname(full) === '.json')
                    out.push(full);
            }
            return out;
        };
        // providers overrides: overrides/providers/{provider}.json
        const provDir = join(folder, 'providers');
        for (const file of walk(provDir)) {
            const providerId = basename(file, '.json');
            const obj = readJSON(file);
            if (obj)
                mergeProviderOverride(providerId, obj);
        }
        // models overrides: overrides/models/{provider}/{model}.json
        const modelsDir = join(folder, 'models');
        if (existsSync(modelsDir)) {
            for (const provider of readdirSync(modelsDir)) {
                const pDir = join(modelsDir, provider);
                if (!statSync(pDir).isDirectory())
                    continue;
                for (const file of readdirSync(pDir)) {
                    const full = join(pDir, file);
                    if (!statSync(full).isFile() || extname(full) !== '.json')
                        continue;
                    const modelId = basename(full, '.json');
                    const obj = readJSON(full);
                    if (obj)
                        mergeModelOverride(provider, modelId, sanitizeModelOverride(obj));
                }
            }
        }
        // i18n overrides (optional): overrides/i18n/providers/*.json & overrides/i18n/models/{provider}/{model}.json
        const i18nDir = join(folder, 'i18n');
        const i18nProvDir = join(i18nDir, 'providers');
        for (const file of walk(i18nProvDir)) {
            const providerId = basename(file, '.json');
            const obj = readJSON(file);
            if (obj)
                mergeProviderI18n(providerId, obj);
        }
        const i18nModelsDir = join(i18nDir, 'models');
        if (existsSync(i18nModelsDir)) {
            for (const provider of readdirSync(i18nModelsDir)) {
                const pDir = join(i18nModelsDir, provider);
                if (!statSync(pDir).isDirectory())
                    continue;
                for (const file of readdirSync(pDir)) {
                    const full = join(pDir, file);
                    if (!statSync(full).isFile() || extname(full) !== '.json')
                        continue;
                    const modelId = basename(full, '.json');
                    const obj = readJSON(full);
                    if (obj)
                        mergeModelI18n(provider, modelId, obj);
                }
            }
        }
        return base;
    }
}
//# sourceMappingURL=data-loader.js.map