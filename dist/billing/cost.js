// 价目数据结构（与 models.dev Cost 对齐，另含仓库扩展）。
// 本目录为浏览器安全的共享代码：构建脚本与 Web UI 共用，不得引入 Node 专有模块。
/**
 * 长效缓存写入档：供应商规则字段 → new-api 表达式变量。
 * 价格 = 同档 input × 倍数，仅对定义了 cache_write（短效写入价）的模型生效。
 */
export const LONG_CACHE_WRITES = [
    { option: 'cacheWrite1h', variable: 'cc1h', ttl: '1h' },
    { option: 'cacheWrite12h', variable: 'cc12h', ttl: '12h' },
];
//# sourceMappingURL=cost.js.map