/** 对象工具函数 */
import { createHash } from 'node:crypto';
/** 深度合并对象 */
export function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const targetValue = result[key];
            if (sourceValue !== undefined) {
                if (typeof sourceValue === 'object' &&
                    sourceValue !== null &&
                    !Array.isArray(sourceValue) &&
                    typeof targetValue === 'object' &&
                    targetValue !== null &&
                    !Array.isArray(targetValue)) {
                    // 递归合并对象
                    result[key] = deepMerge(targetValue, sourceValue);
                }
                else {
                    // 直接覆盖
                    result[key] = sourceValue;
                }
            }
        }
    }
    return result;
}
/** 稳定的 JSON 字符串化 */
export function stableStringify(obj) {
    const sorter = (value) => {
        if (Array.isArray(value))
            return value.map(sorter);
        if (value && typeof value === 'object') {
            const sorted = {};
            for (const key of Object.keys(value).sort()) {
                sorted[key] = sorter(value[key]);
            }
            return sorted;
        }
        return value;
    };
    return JSON.stringify(sorter(obj), null, 2);
}
/** 计算对象的 SHA256 哈希 */
export function sha256OfObject(obj) {
    const str = stableStringify(obj);
    return createHash('sha256').update(str).digest('hex');
}
//# sourceMappingURL=object-utils.js.map