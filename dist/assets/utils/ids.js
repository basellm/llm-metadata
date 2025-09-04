/**
 * ID Processing Utilities
 * Pure functions for ID normalization and variants
 */

export const IDUtils = {
  /**
   * Normalize ID by replacing colons and slashes with underscores
   */
  normalizeId(id) {
    return String(id || '').replace(/[:/]/g, '_');
  },

  /**
   * Generate model ID variants for API lookups
   */
  modelIdVariants(modelId) {
    const v = String(modelId || '');
    const underscore = v.replace(/[:/]/g, '_');
    return Array.from(new Set([underscore, v].filter(Boolean)));
  },
};
