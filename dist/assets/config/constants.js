/**
 * Global Constants
 * Application-wide constants and configuration values
 */

export const CONSTANTS = {
  // Supported locales
  SUPPORTED_LOCALES: ['en', 'zh', 'ja'],

  // Default values
  DEFAULT_LOCALE: 'en',
  DEFAULT_REPO: 'basellm/llm-metadata',

  // API endpoints
  API_ENDPOINTS: {
    PROVIDERS: '/providers.json',
    NEWAPI_VENDORS: '/newapi/vendors.json',
    NEWAPI_MODELS: '/newapi/models.json',
    PROVIDER_DETAIL: '/providers/{provider}.json',
    MODEL_DETAIL: '/models/{provider}/{model}.json',
    I18N_PROVIDER: '/i18n/{locale}/providers/{provider}.json',
    I18N_MODEL: '/i18n/{locale}/models/{provider}/{model}.json',
    I18N_NEWAPI_MODELS: '/i18n/{locale}/newapi/models.json',
  },

  // Form modes
  MODES: {
    SINGLE: 'single',
    BATCH: 'batch',
  },

  // Actions
  ACTIONS: {
    CREATE: 'create',
    UPDATE: 'update',
  },

  // Submission types
  SUBMISSION_TYPES: {
    MODEL: 'model',
    PROVIDER: 'provider',
  },

  // Schema types
  SCHEMAS: {
    MODEL_SUBMISSION: 'model-submission',
    PROVIDER_SUBMISSION: 'provider-submission',
  },

  // GitHub
  GITHUB: {
    ISSUE_LABEL: 'model-submission',
    MAX_URL_LENGTH: 7500,
  },
};
