/**
 * Chips Component
 * Reusable chip selection component logic
 */

import { DOMUtils } from '../../utils/dom.js';

export const ChipsComponent = {
  /**
   * Set chips selection based on values
   */
  setSelection(className, values) {
    if (!values || (Array.isArray(values) && values.length === 0)) return;

    const set = new Set(
      (Array.isArray(values) ? values : [values]).map((v) => String(v).toLowerCase()),
    );

    DOMUtils.$$(`.${className}`).forEach((el) => {
      el.checked = set.has(String(el.value).toLowerCase());
    });
  },

  /**
   * Get selected chip values
   */
  getSelection(className) {
    return Array.from(DOMUtils.$$('.' + className))
      .filter((x) => x.checked)
      .map((x) => x.value);
  },

  /**
   * Clear all chip selections
   */
  clearSelection(className) {
    DOMUtils.$$(`.${className}`).forEach((el) => {
      el.checked = false;
    });
  },

  /**
   * Set default chip selection
   */
  setDefaults(className, defaults) {
    DOMUtils.$$(`.${className}`).forEach((el) => {
      el.checked = defaults.includes(el.value);
    });
  },
};
