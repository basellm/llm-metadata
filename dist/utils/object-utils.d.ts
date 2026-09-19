/** 非 null、非数组的普通对象 */
export declare function isRecord(value: unknown): value is Record<string, unknown>;
/** 深度合并对象 */
export declare function deepMerge<T>(target: T, source: Partial<T>): T;
/** 稳定的 JSON 字符串化 */
export declare function stableStringify(obj: any): string;
/** 计算对象的 SHA256 哈希 */
export declare function sha256OfObject(obj: any): string;
//# sourceMappingURL=object-utils.d.ts.map