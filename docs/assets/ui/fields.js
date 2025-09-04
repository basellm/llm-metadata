/**
 * UI Field Management
 * Field value setters and form manipulation
 */

import { DOMUtils } from '../utils/dom.js';
import { ObjectUtils } from '../utils/object.js';
import { FIELD_DEFAULTS, PROVIDER_FIELD_DEFAULTS } from './defaults.js';

export const FieldManager = {
  /**
   * Set field value if not empty
   */
  setValue(id, val) {
    const el = DOMUtils.$(id);
    if (!el || val === undefined || val === null) return;

    const s = typeof val === 'string' ? val : String(val);
    if (s.trim() !== '') el.value = s;
  },

  /**
   * Set numeric field value
   */
  setNumber(id, val) {
    if (val === undefined || val === null || isNaN(Number(val))) return;
    this.setValue(id, String(val));
  },

  /**
   * Set checkbox chips based on values
   */
  setChips(className, values) {
    if (!values || (Array.isArray(values) && values.length === 0)) return;

    const set = new Set(
      (Array.isArray(values) ? values : [values]).map((v) => String(v).toLowerCase()),
    );

    DOMUtils.$$(`.${className}`).forEach((el) => {
      el.checked = set.has(String(el.value).toLowerCase());
    });
  },

  /**
   * Set i18n fields for a locale
   */
  setI18nFields(locale, data) {
    this.setValue(`i18n-name-${locale}`, ObjectUtils.pick(data, ['name', 'displayName', 'title']));
    this.setValue(
      `i18n-desc-${locale}`,
      ObjectUtils.pick(data, ['description', 'desc', 'summary']),
    );
  },

  /**
   * Set provider i18n fields for a locale
   */
  setProviderI18nFields(locale, data) {
    this.setValue(
      `provider-i18n-name-${locale}`,
      ObjectUtils.pick(data, ['name', 'displayName', 'title']),
    );
    this.setValue(
      `provider-i18n-desc-${locale}`,
      ObjectUtils.pick(data, ['description', 'desc', 'summary']),
    );
  },

  /**
   * Clear all model fields to defaults
   */
  clearAllFields() {
    Object.entries(FIELD_DEFAULTS.values).forEach(([id, defaultValue]) => {
      const el = DOMUtils.$(id);
      if (el) el.value = defaultValue;
    });

    Object.entries(FIELD_DEFAULTS.checkboxes).forEach(([id, defaultChecked]) => {
      const el = DOMUtils.$(id);
      if (el) el.checked = defaultChecked;
    });
  },

  /**
   * Clear provider fields to defaults
   */
  clearProviderFields() {
    Object.entries(PROVIDER_FIELD_DEFAULTS.values).forEach(([id, defaultValue]) => {
      const el = DOMUtils.$(id);
      if (el) el.value = defaultValue;
    });
  },
};
