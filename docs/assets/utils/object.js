/**
 * Object Processing Utilities
 * Pure functions for object manipulation
 */

export const ObjectUtils = {
  /**
   * Remove undefined, null, empty strings, and empty arrays from object
   */
  prune(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const out = Array.isArray(obj) ? [] : {};

    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;

      if (typeof v === 'object') {
        const pv = this.prune(v);
        if (
          pv === undefined ||
          (typeof pv === 'object' && !Array.isArray(pv) && Object.keys(pv).length === 0)
        )
          continue;
        out[k] = pv;
      } else {
        out[k] = v;
      }
    }

    return out;
  },

  /**
   * Pick first available value from object using key paths
   */
  pick(obj, keys) {
    for (const k of keys) {
      const parts = k.split('.');
      let cur = obj;
      let ok = true;

      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
          cur = cur[p];
        } else {
          ok = false;
          break;
        }
      }

      if (ok && cur !== undefined && cur !== null) return cur;
    }

    return undefined;
  },
};
