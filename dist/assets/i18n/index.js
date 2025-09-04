/**
 * i18n Module
 * Internationalization utilities and translation management
 */

import { en } from './en.js';
import { zh } from './zh.js';
import { ja } from './ja.js';
import { EnvConfig } from '../config/env.js';
import { CONSTANTS } from '../config/constants.js';

// Translation registry
const translations = { en, zh, ja };

export const I18N = {
  /**
   * Get translation for key in current language
   */
  t(key) {
    const lang = EnvConfig.getCurrentLang();
    const translation = translations[lang] || translations[CONSTANTS.DEFAULT_LOCALE];
    return translation[key] || translations.en[key] || key;
  },

  /**
   * Get all translations
   */
  getTranslations() {
    return translations;
  },

  /**
   * Get translation for specific language
   */
  getTranslation(lang) {
    return translations[lang] || translations[CONSTANTS.DEFAULT_LOCALE];
  },
};
