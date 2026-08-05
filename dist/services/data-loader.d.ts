import type { NativeProvidersConfig, OverrideConfig, PolicyConfig, SourceData } from '../types/index.js';
/** 数据加载服务 */
export declare class DataLoader {
    private readonly dataDir;
    private readonly cacheDir;
    constructor(dataDir: string, cacheDir: string);
    /** 从网络或缓存加载源数据 */
    loadSourceData(sourceUrl: string): Promise<SourceData>;
    /** 安全读取 JSON 文件 */
    readJSONSafe<T>(filePath: string, defaultValue: T): T;
    /** 加载策略配置 */
    loadPolicy(): PolicyConfig;
    /** 加载原生供应商目录（缺失时返回 null，构建将跳过过滤） */
    loadNativeProviders(): NativeProvidersConfig | null;
    /** 加载覆写配置 */
    loadOverrides(): OverrideConfig;
}
//# sourceMappingURL=data-loader.d.ts.map