/**
 * UI Field Defaults
 * Default values and configurations for form fields
 */

export const FIELD_DEFAULTS = {
  // Text input defaults
  values: {
    'i18n-name-en': '',
    'i18n-name-zh': '',
    'i18n-name-ja': '',
    'i18n-desc-en': '',
    'i18n-desc-zh': '',
    'i18n-desc-ja': '',
    knowledge: '',
    'release-date': '',
    'last-updated': '',
    'limit-context': '',
    'limit-output': '',
    'cost-input': '',
    'cost-output': '',
    'cost-cache-read': '',
    'cost-cache-write': '',
  },

  // Checkbox defaults
  checkboxes: {
    'cap-reasoning': false,
    'cap-tools': false,
    'cap-files': false,
    'cap-temp': false,
    'cap-open-weights': false,
    'in-text': true,
    'in-image': false,
    'in-audio': false,
    'in-video': false,
    'in-pdf': false,
    'out-text': true,
    'out-image': false,
    'out-audio': false,
    'out-video': false,
    'out-pdf': false,
  },
};

export const PROVIDER_FIELD_DEFAULTS = {
  values: {
    'provider-api': '',
    'provider-icon': '',
    'provider-icon-url': '',
    'provider-lobe-icon': '',
    'provider-i18n-name-en': '',
    'provider-i18n-name-zh': '',
    'provider-i18n-name-ja': '',
    'provider-i18n-desc-en': '',
    'provider-i18n-desc-zh': '',
    'provider-i18n-desc-ja': '',
  },
};
