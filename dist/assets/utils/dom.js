/**
 * DOM Utilities
 * Pure DOM manipulation helpers
 */

export const DOMUtils = {
  /**
   * Get element by ID
   */
  $(id) {
    return document.getElementById(id);
  },

  /**
   * Query all elements by selector
   */
  $$(selector) {
    return document.querySelectorAll(selector);
  },

  /**
   * Set element visibility
   */
  setVisibility(id, isHidden) {
    const el = this.$(id);
    if (el) el.classList.toggle('is-hidden', isHidden);
  },

  /**
   * Set element text content
   */
  setText(id, text) {
    const el = this.$(id);
    if (el) el.textContent = text;
  },

  /**
   * Set element HTML content
   */
  setHTML(id, html) {
    const el = this.$(id);
    if (el) el.innerHTML = html;
  },

  /**
   * Set element disabled state
   */
  setDisabled(id, disabled) {
    const el = this.$(id);
    if (el) el.disabled = disabled;
  },

  /**
   * Add event listener to element
   */
  on(id, event, handler) {
    const el = this.$(id);
    if (el) el.addEventListener(event, handler);
  },

  /**
   * Get checked radio button value by name
   */
  getCheckedRadio(name) {
    return this.$$(`input[name="${name}"]:checked`)[0]?.value || '';
  },
};
