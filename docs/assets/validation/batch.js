/**
 * Batch Validation
 * Validation logic for batch form submissions
 */

import { ValueUtils } from '../utils/values.js';
import { I18N } from '../i18n/index.js';
import { CONSTANTS } from '../config/constants.js';

export const BatchValidation = {
  /**
   * Validate individual batch items
   */
  validateItems(items) {
    const errors = [];

    (items || []).forEach((item, i) => {
      if (!item || typeof item !== 'object') {
        errors.push(`${i + 1}. ${I18N.t('batchInvalidItem')}`);
        return;
      }

      if (item.schema === CONSTANTS.SCHEMAS.PROVIDER_SUBMISSION) {
        // Provider validation
        if (!item.id) {
          errors.push(`${i + 1}. ${I18N.t('batchMissingId')}`);
        }
      } else {
        // Model validation
        if (!item.providerId) {
          errors.push(`${i + 1}. ${I18N.t('batchMissingProvider')}`);
        }
        if (!item.id) {
          errors.push(`${i + 1}. ${I18N.t('batchMissingId')}`);
        }
      }
    });

    return errors;
  },

  /**
   * Parse and validate batch JSON
   */
  parseAndValidate() {
    const raw = ValueUtils.value('batch-json');

    if (!raw) {
      return {
        valid: false,
        items: [],
        error: I18N.t('batchCannotBeEmpty'),
      };
    }

    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      if (!items.length) {
        return {
          valid: false,
          items,
          error: I18N.t('batchCannotBeEmpty'),
        };
      }

      const errors = this.validateItems(items);

      if (errors.length) {
        return {
          valid: false,
          items,
          error: `${I18N.t('batchValidateFailed')}: ${errors[0]}`,
        };
      }

      return { valid: true, items, error: '' };
    } catch (e) {
      return {
        valid: false,
        items: [],
        error: `${I18N.t('batchJsonError')}: ${e.message}`,
      };
    }
  },
};
