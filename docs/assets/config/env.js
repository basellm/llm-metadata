/**
 * Environment Configuration
 * Runtime environment detection and API configuration
 */

export const EnvConfig = {
  /**
   * Get API base URL based on current environment
   */
  getApiBase() {
    const root = document.getElementById('model-submit');
    if (!root) return this.getDefaultApiBase();

    const customApi = root.getAttribute('data-api');
    return customApi ? customApi.replace(/\/$/, '') : this.getDefaultApiBase();
  },

  /**
   * Get default API base URL based on hostname
   */
  getDefaultApiBase() {
    const hostname = window.location.hostname;

    if (hostname === 'basellm.github.io') {
      return 'https://basellm.github.io/llm-metadata/api';
    } else if (hostname === 'llm-metadata.pages.dev') {
      return 'https://llm-metadata.pages.dev/api';
    }

    // Default to GitHub Pages for other domains
    return 'https://basellm.github.io/llm-metadata/api';
  },

  /**
   * Get current language from DOM
   */
  getCurrentLang() {
    const root = document.getElementById('model-submit');
    return (root?.getAttribute('data-lang') || 'en').toLowerCase();
  },

  /**
   * Get repository from DOM or default
   */
  getRepository() {
    const root = document.getElementById('model-submit');
    return root?.getAttribute('data-repo') || 'basellm/llm-metadata';
  },
};
