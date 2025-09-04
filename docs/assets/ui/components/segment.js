/**
 * Segment Component
 * Reusable segmented control component logic
 */

import { DOMUtils } from '../../utils/dom.js';

export const SegmentComponent = {
  /**
   * Get selected segment value
   */
  getSelected(name) {
    return DOMUtils.getCheckedRadio(name);
  },

  /**
   * Set selected segment
   */
  setSelected(name, value) {
    const radio = DOMUtils.$(`${name}-${value}`);
    if (radio) radio.checked = true;
  },

  /**
   * Add change listener to segment
   */
  onChange(name, callback) {
    DOMUtils.$$(`input[name="${name}"]`).forEach((radio) => {
      radio.addEventListener('change', function () {
        if (this.checked) {
          callback(this.value);
        }
      });
    });
  },

  /**
   * Enable/disable segment
   */
  setEnabled(name, enabled) {
    DOMUtils.$$(`input[name="${name}"]`).forEach((radio) => {
      radio.disabled = !enabled;
    });
  },
};
