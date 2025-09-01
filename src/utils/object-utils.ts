/** 对象工具函数 */
import { createHash } from 'node:crypto';

/** 深度合并对象 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (sourceValue !== undefined) {
        if (
          typeof sourceValue === 'object' &&
          sourceValue !== null &&
          !Array.isArray(sourceValue) &&
          typeof targetValue === 'object' &&
          targetValue !== null &&
          !Array.isArray(targetValue)
        ) {
          // 递归合并对象
          (result as any)[key] = deepMerge(targetValue, sourceValue);
        } else {
          // 直接覆盖
          (result as any)[key] = sourceValue;
        }
      }
    }
  }

  return result;
}

/** 稳定的 JSON 字符串化 */
export function stableStringify(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort(), 2);
}

/** 计算对象的 SHA256 哈希 */
export function sha256OfObject(obj: any): string {
  const str = stableStringify(obj);
  return createHash('sha256').update(str).digest('hex');
}
