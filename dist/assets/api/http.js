/**
 * HTTP Client
 * Pure HTTP utilities for API communication
 */

export const HTTPClient = {
  /**
   * Fetch JSON with error handling
   */
  async fetchJSON(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  /**
   * Try multiple URLs until one succeeds
   */
  async fetchFirstOk(urls) {
    for (const url of urls) {
      try {
        return await this.fetchJSON(url);
      } catch (_) {
        // Continue to next URL
      }
    }
    throw new Error('All fetch candidates failed');
  },
};
