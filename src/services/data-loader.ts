import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

import type { OverrideConfig, PolicyConfig, SourceData, I18nOverrideEntity, ModelKey } from '../types/index.js';
import { deepMerge } from '../utils/object-utils.js';

/** 数据加载服务 */
export class DataLoader {
  constructor(
    private readonly dataDir: string,
    private readonly cacheDir: string,
  ) {}

  /** 从网络或缓存加载源数据 */
  async loadSourceData(sourceUrl: string): Promise<SourceData> {
    try {
      const response = await fetch(sourceUrl, {
        headers: { accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed ${response.status} ${sourceUrl}`);
      }

      return response.json() as Promise<SourceData>;
    } catch (error) {
      // 网络失败时尝试使用缓存
      const cachePath = join(this.cacheDir, 'api.json');
      if (existsSync(cachePath)) {
        console.warn('Network failed, using cached data:', error);
        return this.readJSONSafe<SourceData>(cachePath, {});
      }
      throw error;
    }
  }

  /** 安全读取 JSON 文件 */
  readJSONSafe<T>(filePath: string, defaultValue: T): T {
    try {
      if (!existsSync(filePath)) {
        return defaultValue;
      }
      const content = readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    } catch (error) {
      console.warn(`Failed to read ${filePath}:`, error);
      return defaultValue;
    }
  }

  /** 加载策略配置 */
  loadPolicy(): PolicyConfig {
    const policyPath = join(this.dataDir, 'policy.json');
    return this.readJSONSafe(policyPath, { providers: {}, models: {} });
  }

  /** 加载覆写配置 */
  loadOverrides(): OverrideConfig {
    // overrides.json is deprecated; start from an empty base and only read from overrides/ directory
    const base: OverrideConfig = {
      providers: {},
      models: {},
      i18n: { providers: {}, models: {} as Record<ModelKey, I18nOverrideEntity> },
    } as unknown as OverrideConfig;

    const folder = join(this.dataDir, 'overrides');
    if (!existsSync(folder)) return base;

    const safeDeepMerge = <T>(a: T, b: Partial<T>): T => deepMerge(a as any, b as any) as T;

    const mergeProviderOverride = (providerId: string, override: any) => {
      base.providers = base.providers || {};
      base.providers[providerId] = safeDeepMerge(base.providers[providerId] || ({} as any), override || {});
    };

    const mergeModelOverride = (providerId: string, modelId: string, override: any) => {
      const key = `${providerId}/${modelId}`;
      base.models = base.models || {};
      base.models[key] = safeDeepMerge(base.models[key] || ({} as any), override || {});
    };

    type I18nBag = NonNullable<OverrideConfig['i18n']> & { models: Record<ModelKey, I18nOverrideEntity> };
    const ensureI18n = (): I18nBag => {
      if (!base.i18n) {
        (base as any).i18n = { providers: {}, models: {} as Record<ModelKey, I18nOverrideEntity> } as I18nBag;
      } else {
        if (!base.i18n.providers) (base.i18n as any).providers = {} as Record<string, I18nOverrideEntity>;
        if (!base.i18n.models) (base.i18n as any).models = {} as Record<ModelKey, I18nOverrideEntity>;
      }
      return base.i18n as unknown as I18nBag;
    };

    const mergeProviderI18n = (providerId: string, override: I18nOverrideEntity) => {
      const i18n = ensureI18n();
      (i18n.providers as Record<string, I18nOverrideEntity>)[providerId] = safeDeepMerge(
        ((i18n.providers as Record<string, I18nOverrideEntity>)[providerId] as I18nOverrideEntity) || ({} as I18nOverrideEntity),
        override || ({} as I18nOverrideEntity),
      );
    };

    const mergeModelI18n = (providerId: string, modelId: string, override: I18nOverrideEntity) => {
      const i18n = ensureI18n();
      const key = `${providerId}/${modelId}` as ModelKey;
      i18n.models[key] = safeDeepMerge(
        (i18n.models[key] as I18nOverrideEntity) || ({} as I18nOverrideEntity),
        override || ({} as I18nOverrideEntity),
      );
    };

    const readJSON = (p: string): any => {
      try {
        const txt = readFileSync(p, 'utf8');
        return JSON.parse(txt);
      } catch {
        return undefined;
      }
    };

    const walk = (dir: string) => {
      if (!existsSync(dir)) return [] as string[];
      const out: string[] = [];
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) out.push(...walk(full));
        else if (st.isFile() && extname(full) === '.json') out.push(full);
      }
      return out;
    };

    // providers overrides: overrides/providers/{provider}.json
    const provDir = join(folder, 'providers');
    for (const file of walk(provDir)) {
      const providerId = basename(file, '.json');
      const obj = readJSON(file);
      if (obj) mergeProviderOverride(providerId, obj);
    }

    // models overrides: overrides/models/{provider}/{model}.json
    const modelsDir = join(folder, 'models');
    if (existsSync(modelsDir)) {
      for (const provider of readdirSync(modelsDir)) {
        const pDir = join(modelsDir, provider);
        if (!statSync(pDir).isDirectory()) continue;
        for (const file of readdirSync(pDir)) {
          const full = join(pDir, file);
          if (!statSync(full).isFile() || extname(full) !== '.json') continue;
          const modelId = basename(full, '.json');
          const obj = readJSON(full);
          if (obj) mergeModelOverride(provider, modelId, obj);
        }
      }
    }

    // i18n overrides (optional): overrides/i18n/providers/*.json & overrides/i18n/models/{provider}/{model}.json
    const i18nDir = join(folder, 'i18n');
    const i18nProvDir = join(i18nDir, 'providers');
    for (const file of walk(i18nProvDir)) {
      const providerId = basename(file, '.json');
      const obj = readJSON(file);
      if (obj) mergeProviderI18n(providerId, obj);
    }
    const i18nModelsDir = join(i18nDir, 'models');
    if (existsSync(i18nModelsDir)) {
      for (const provider of readdirSync(i18nModelsDir)) {
        const pDir = join(i18nModelsDir, provider);
        if (!statSync(pDir).isDirectory()) continue;
        for (const file of readdirSync(pDir)) {
          const full = join(pDir, file);
          if (!statSync(full).isFile() || extname(full) !== '.json') continue;
          const modelId = basename(full, '.json');
          const obj = readJSON(full);
          if (obj) mergeModelI18n(provider, modelId, obj);
        }
      }
    }

    return base;
  }
}
