import type { Provider } from '../types/index.js';
export interface LogoMirrorResult {
    changes: number;
    warnings: string[];
}
/**
 * 供应商 logo 镜像服务。
 *
 * 将各供应商 iconURL 指向的 SVG 下载到本地缓存并复制到
 * dist/api/logos/<id>.svg，使 Web UI 以同源地址加载图标，
 * 摆脱对 models.dev 等第三方主机可达性的依赖。
 * 下载失败时保留既有缓存副本并给出警告；--check 模式不发起网络请求。
 */
export declare function mirrorProviderLogos(providers: Record<string, Provider>, dirs: {
    cacheDir: string;
    outDir: string;
}, options?: {
    dryRun?: boolean;
    force?: boolean;
}): Promise<LogoMirrorResult>;
//# sourceMappingURL=logo-mirror.d.ts.map