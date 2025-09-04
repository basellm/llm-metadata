/**
 * Select Component
 * Reusable select dropdown component logic
 */

import { DOMUtils } from '../../utils/dom.js';

export const SelectComponent = {
  /**
   * Populate select with options
   */
  populate(selectId, options, placeholder = '') {
    const select = DOMUtils.$(selectId);
    if (!select) return;

    const sortedOptions = [...options].sort();
    const optionsHtml = sortedOptions
      .map((opt) => `<option value="${this.escapeHtml(opt)}">${this.escapeHtml(opt)}</option>`)
      .join('');

    select.innerHTML = placeholder
      ? `<option value="">${this.escapeHtml(placeholder)}</option>${optionsHtml}`
      : optionsHtml;
  },

  /**
   * Get selected value
   */
  getValue(selectId) {
    const select = DOMUtils.$(selectId);
    return select ? select.value : '';
  },

  /**
   * Set selected value
   */
  setValue(selectId, value) {
    const select = DOMUtils.$(selectId);
    if (select) select.value = value;
  },

  /**
   * Clear select options
   */
  clear(selectId) {
    const select = DOMUtils.$(selectId);
    if (select) select.innerHTML = '';
  },

  /**
   * Add change listener
   */
  onChange(selectId, callback) {
    const select = DOMUtils.$(selectId);
    if (select) {
      select.addEventListener('change', function () {
        callback(this.value);
      });
    }
  },

  /**
   * Enable/disable select
   */
  setEnabled(selectId, enabled) {
    const select = DOMUtils.$(selectId);
    if (select) select.disabled = !enabled;
  },

  /**
   * Escape HTML for safe insertion
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};
