/**
 * UI Status Management
 * Status messages and button states
 */

import { DOMUtils } from '../utils/dom.js';

export const StatusManager = {
  /**
   * Set status message
   */
  setStatus(msg, isError = false) {
    const el = DOMUtils.$('status');
    if (!el) return;

    el.textContent = msg || '';
    el.classList.toggle('error', isError && !!msg);
  },

  /**
   * Set button enabled/disabled state
   */
  setButtonEnabled(id, enabled) {
    DOMUtils.setDisabled(id, !enabled);
  },

  /**
   * Set open issue button state
   */
  setOpenIssueEnabled(enabled) {
    this.setButtonEnabled('open-issue', enabled);
  },
};
