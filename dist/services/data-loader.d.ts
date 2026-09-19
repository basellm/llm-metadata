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
    /**
     * 加载目录化覆写（data/overrides/**）。每个文件对应唯一键：
     * providers/<provider>.json、models/<provider>/<model>.json，
     * i18n/providers/<provider>.json、i18n/models/<provider>/<model>.json。
     */
    loadOverrides(): OverrideConfig;
}
//# sourceMappingURL=data-loader.d.ts.map