/**
 * Providers API
 * Provider-related API operations
 */

import { HTTPClient } from './http.js';
import { EnvConfig } from '../config/env.js';
import { CONSTANTS } from '../config/constants.js';
import { URLUtils } from '../utils/urls.js';

export const ProvidersAPI = {
  /**
   * Extract provider list from various data formats
   */
  extractProviderList(data) {
    if (Array.isArray(data)) {
      return data.map((x) => x.id || x.name || x.providerId || x.key).filter(Boolean);
    }

    if (data?.providers && Array.isArray(data.providers)) {
      return data.providers.map((x) => x.id || x.name || x.key).filter(Boolean);
    }

    return Object.keys(data || {});
  },

  /**
   * Load providers list
   */
  async loadProviders() {
    try {
      const apiBase = EnvConfig.getApiBase();
      const urls = [
        apiBase + CONSTANTS.API_ENDPOINTS.PROVIDERS,
        apiBase + CONSTANTS.API_ENDPOINTS.NEWAPI_VENDORS,
      ];

      const data = await HTTPClient.fetchFirstOk(urls);
      return this.extractProviderList(data);
    } catch (e) {
      console.error('loadProviders failed', e);
      return [];
    }
  },

  /**
   * Load provider detail with i18n data
   */
  async loadProviderDetail(providerId) {
    try {
      if (!providerId) return { data: {}, i18nData: {} };

      const apiBase = EnvConfig.getApiBase();
      const lang = EnvConfig.getCurrentLang();

      // Load main data
      const mainUrls = [
        apiBase +
          URLUtils.replaceTemplate(CONSTANTS.API_ENDPOINTS.PROVIDER_DETAIL, {
            provider: providerId,
          }),
        apiBase +
          URLUtils.replaceTemplate(CONSTANTS.API_ENDPOINTS.I18N_PROVIDER, {
            locale: lang,
            provider: providerId,
          }),
      ];

      const data = await HTTPClient.fetchFirstOk(mainUrls);

      // Load i18n data in parallel
      const i18nData = {};
      await Promise.all(
        CONSTANTS.SUPPORTED_LOCALES.map(async (locale) => {
          try {
            const url =
              apiBase +
              URLUtils.replaceTemplate(CONSTANTS.API_ENDPOINTS.I18N_PROVIDER, {
                locale,
                provider: providerId,
              });
            i18nData[locale] = await HTTPClient.fetchJSON(url);
          } catch (_) {
            i18nData[locale] = {};
          }
        }),
      );

      return { data, i18nData };
    } catch (e) {
      console.error('loadProviderDetail failed', e);
      return { data: {}, i18nData: {} };
    }
  },
};
