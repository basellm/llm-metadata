/**
 * Models API
 * Model-related API operations
 */

import { HTTPClient } from './http.js';
import { EnvConfig } from '../config/env.js';
import { CONSTANTS } from '../config/constants.js';
import { URLUtils } from '../utils/urls.js';
import { IDUtils } from '../utils/ids.js';

export const ModelsAPI = {
  /**
   * Extract model list from provider data
   */
  extractModelList(data, providerId) {
    if (Array.isArray(data?.models)) {
      return data.models
        .map((m) => (typeof m === 'string' ? m : m?.id || m?.modelId))
        .filter(Boolean);
    }

    if (data?.models && typeof data.models === 'object') {
      return Object.keys(data.models);
    }

    return [];
  },

  /**
   * Build model API URLs with variants
   */
  buildModelUrls(providerId, variants) {
    const apiBase = EnvConfig.getApiBase();
    const lang = EnvConfig.getCurrentLang();

    const templates = [
      `{apiBase}${CONSTANTS.API_ENDPOINTS.MODEL_DETAIL}`,
      `{apiBase}${CONSTANTS.API_ENDPOINTS.I18N_MODEL.replace('{locale}', lang)}`,
    ];

    return URLUtils.buildApiUrls(providerId, variants, templates, apiBase);
  },

  /**
   * Build i18n model URLs for specific locale
   */
  buildI18nModelUrls(providerId, variants, locale) {
    const apiBase = EnvConfig.getApiBase();
    const templates = [
      `{apiBase}${CONSTANTS.API_ENDPOINTS.I18N_MODEL.replace('{locale}', locale)}`,
    ];

    return URLUtils.buildApiUrls(providerId, variants, templates, apiBase);
  },

  /**
   * Fetch NewAPI models data
   */
  async fetchNewApiModels() {
    const apiBase = EnvConfig.getApiBase();
    const lang = EnvConfig.getCurrentLang();

    const urls = [
      apiBase + CONSTANTS.API_ENDPOINTS.NEWAPI_MODELS,
      apiBase +
        URLUtils.replaceTemplate(CONSTANTS.API_ENDPOINTS.I18N_NEWAPI_MODELS, { locale: lang }),
    ];

    return await HTTPClient.fetchFirstOk(urls).catch(() => []);
  },

  /**
   * Find model in NewAPI models list
   */
  async findModelInAll(providerId, variants) {
    const all = await this.fetchNewApiModels();

    if (Array.isArray(all)) {
      const normVariants = new Set(variants.map(IDUtils.normalizeId));
      return (
        all.find(
          (x) =>
            (x.providerId || x.provider || x.vendor) === providerId &&
            (normVariants.has(IDUtils.normalizeId(x.id)) ||
              normVariants.has(IDUtils.normalizeId(x.modelId))),
        ) || {}
      );
    }

    return {};
  },

  /**
   * Load models for a provider
   */
  async loadModels(providerId) {
    try {
      if (!providerId) return [];

      const apiBase = EnvConfig.getApiBase();
      const lang = EnvConfig.getCurrentLang();

      const urls = [
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

      const data = await HTTPClient.fetchFirstOk(urls);
      let models = this.extractModelList(data, providerId);

      // Fallback to NewAPI models if no models found
      if (!models.length) {
        const all = await this.fetchNewApiModels();
        if (Array.isArray(all)) {
          models = all
            .filter((x) => (x.providerId || x.provider || x.vendor) === providerId)
            .map((x) => x.id || x.modelId)
            .filter(Boolean);
        }
      }

      return models;
    } catch (e) {
      console.error('loadModels failed', e);
      return [];
    }
  },

  /**
   * Load model detail with i18n data
   */
  async loadModelDetail(providerId, modelId) {
    try {
      if (!providerId || !modelId) return { data: {}, i18nData: {} };

      const variants = IDUtils.modelIdVariants(modelId);
      const candidateUrls = this.buildModelUrls(providerId, variants);

      // Try to load from direct URLs first, fallback to NewAPI search
      const data = await HTTPClient.fetchFirstOk(candidateUrls).catch(() =>
        this.findModelInAll(providerId, variants),
      );

      // Load i18n data in parallel
      const i18nData = {};
      await Promise.all(
        CONSTANTS.SUPPORTED_LOCALES.map(async (locale) => {
          try {
            const urls = this.buildI18nModelUrls(providerId, variants, locale);
            i18nData[locale] = await HTTPClient.fetchFirstOk(urls);
          } catch (_) {
            i18nData[locale] = {};
          }
        }),
      );

      return { data, i18nData };
    } catch (e) {
      console.error('loadModelDetail failed', e);
      return { data: {}, i18nData: {} };
    }
  },
};
