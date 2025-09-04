/**
 * Issue Title Generation
 * Generate titles for GitHub issues
 */

import { I18N } from '../i18n/index.js';
import { CONSTANTS } from '../config/constants.js';

export const TitleGenerator = {
  /**
   * Build title for single submission
   */
  buildSingle(item) {
    if (item.schema === CONSTANTS.SCHEMAS.PROVIDER_SUBMISSION) {
      const actionProvider =
        item.action === CONSTANTS.ACTIONS.UPDATE
          ? I18N.t('updateProvider')
          : I18N.t('createProvider');
      return `[${actionProvider}] ${item.id ?? ''}`;
    } else {
      const actionModel =
        item.action === CONSTANTS.ACTIONS.UPDATE ? I18N.t('updateModel') : I18N.t('createModel');
      return `[${actionModel}] ${item.providerId ?? ''}/${item.id ?? ''}`;
    }
  },

  /**
   * Build title for batch submission
   */
  buildBatch(items) {
    const models = items.filter((item) => item.schema !== CONSTANTS.SCHEMAS.PROVIDER_SUBMISSION);
    const providers = items.filter((item) => item.schema === CONSTANTS.SCHEMAS.PROVIDER_SUBMISSION);

    const summaryParts = [];
    if (models.length > 0) {
      summaryParts.push(`${models.length} ${I18N.t('modelsCount')}`);
    }
    if (providers.length > 0) {
      summaryParts.push(`${providers.length} ${I18N.t('providersCount')}`);
    }

    const summaryText = summaryParts.join(' + ') || `${items.length} items`;
    return `[${I18N.t('batchSubmission')}] ${summaryText}`;
  },
};
