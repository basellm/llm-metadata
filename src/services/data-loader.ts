import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import type { OverrideConfig, PolicyConfig, SourceData } from '../types/index.js';

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
    const overridesPath = join(this.dataDir, 'overrides.json');
    return this.readJSONSafe(overridesPath, { providers: {}, models: {} });
  }
}
