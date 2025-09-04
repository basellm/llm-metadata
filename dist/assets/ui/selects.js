/**
 * UI Select Management
 * Dropdown population and management
 */

import { DOMUtils } from '../utils/dom.js';

export const SelectManager = {
  /**
   * Populate select dropdown with options
   */
  populate(id, options, placeholder) {
    const sel = DOMUtils.$(id);
    if (!sel) return;

    const optionsHtml = options
      .sort()
      .map((opt) => `<option value="${opt}">${opt}</option>`)
      .join('');

    sel.innerHTML = `<option value="">${placeholder}</option>${optionsHtml}`;
  },

  /**
   * Clear select dropdown
   */
  clear(id) {
    const sel = DOMUtils.$(id);
    if (sel) sel.innerHTML = '';
  },
};
