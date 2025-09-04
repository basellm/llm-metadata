/**
 * URL Building Utilities
 * Pure functions for constructing API URLs
 */

export const URLUtils = {
  /**
   * Build multiple API URLs from templates and variants
   */
  buildApiUrls(providerId, variants, pathTemplates, apiBase) {
    const encProv = encodeURIComponent(providerId);
    const urls = [];

    for (const v of variants) {
      const enc = encodeURIComponent(v);
      for (const template of pathTemplates) {
        urls.push(
          template
            .replace('{provider}', encProv)
            .replace('{model}', enc)
            .replace('{apiBase}', apiBase),
        );
      }
    }

    return urls;
  },

  /**
   * Replace template variables in URL path
   */
  replaceTemplate(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value));
    }
    return result;
  },
};
