/**
 * Single Item Validation
 * Validation logic for single form submissions
 */

import { ValueUtils } from '../utils/values.js';
import { I18N } from '../i18n/index.js';
import { CONSTANTS } from '../config/constants.js';

export const SingleValidation = {
  /**
   * Validate required fields for single submission
   */
  validateRequired() {
    const submissionType = ValueUtils.getSubmissionType();

    if (submissionType === CONSTANTS.SUBMISSION_TYPES.PROVIDER) {
      const providerId = ValueUtils.value('provider-id');
      if (!providerId) {
        return { valid: false, error: I18N.t('providerIdRequired') };
      }
    } else {
      // Model submission
      const providerId = ValueUtils.value('providerId');
      const modelId = ValueUtils.value('id');

      if (!providerId) {
        return { valid: false, error: I18N.t('providerRequired') };
      }
      if (!modelId) {
        return { valid: false, error: I18N.t('modelRequired') };
      }
    }

    return { valid: true, error: '' };
  },
};
