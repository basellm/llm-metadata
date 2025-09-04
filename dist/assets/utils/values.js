/**
 * Form Value Utilities
 * Pure functions for reading form values
 */

import { DOMUtils } from './dom.js';

export const ValueUtils = {
  /**
   * Get trimmed input value
   */
  value(id) {
    return (DOMUtils.$(id)?.value || '').trim();
  },

  /**
   * Get numeric value from input
   */
  num(id) {
    const v = this.value(id);
    return v ? Number(v) : undefined;
  },

  /**
   * Get checkbox checked state
   */
  checked(id) {
    return !!DOMUtils.$(id)?.checked;
  },

  /**
   * Gather checked values from checkboxes with same class
   */
  gather(className) {
    return Array.from(DOMUtils.$$('.' + className))
      .filter((x) => x.checked)
      .map((x) => x.value);
  },

  /**
   * Get current form mode
   */
  getMode() {
    return DOMUtils.getCheckedRadio('mode') || 'single';
  },

  /**
   * Get current action
   */
  getAction() {
    return DOMUtils.getCheckedRadio('action') || 'create';
  },

  /**
   * Get current submission type
   */
  getSubmissionType() {
    return DOMUtils.getCheckedRadio('submission-type') || 'model';
  },
};
