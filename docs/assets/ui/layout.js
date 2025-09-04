/**
 * UI Layout Management
 * Visibility control and mode switching
 */

import { DOMUtils } from '../utils/dom.js';
import { ValueUtils } from '../utils/values.js';
import { ProvidersAPI } from '../api/providers.js';
import { I18N } from '../i18n/index.js';
import { CONSTANTS } from '../config/constants.js';
import { SelectManager } from './selects.js';
import { BatchPreview } from './batch-preview.js';

export const LayoutManager = {
  /**
   * Toggle element visibility
   */
  toggleVisibility(id, isHidden) {
    DOMUtils.setVisibility(id, isHidden);
  },

  /**
   * Set form mode (create/update)
   */
  async setMode(mode) {
    const isUpdate = mode === CONSTANTS.ACTIONS.UPDATE;
    const submissionType = ValueUtils.getSubmissionType();

    if (submissionType === CONSTANTS.SUBMISSION_TYPES.PROVIDER) {
      LayoutManager.toggleVisibility('provider-id', isUpdate);
      LayoutManager.toggleVisibility('provider-select', !isUpdate);

      if (isUpdate) {
        const providers = await ProvidersAPI.loadProviders();
        SelectManager.populate('provider-select', providers, I18N.t('providersSelect'));
      } else {
        SelectManager.clear('provider-select');
      }
    } else {
      // Model submission
      LayoutManager.toggleVisibility('providerId', true);
      LayoutManager.toggleVisibility('providerSelect', false);

      const providers = await ProvidersAPI.loadProviders();
      SelectManager.populate('providerSelect', providers, I18N.t('providersSelect'));

      LayoutManager.toggleVisibility('id', isUpdate);
      LayoutManager.toggleVisibility('modelSelect', !isUpdate);

      if (!isUpdate) {
        SelectManager.clear('modelSelect');
      }
    }
  },

  /**
   * Toggle submission type (model/provider)
   */
  toggleSubmissionType() {
    const isProvider = ValueUtils.getSubmissionType() === CONSTANTS.SUBMISSION_TYPES.PROVIDER;

    LayoutManager.toggleVisibility('provider-fields', !isProvider);
    LayoutManager.toggleVisibility('provider-i18n', !isProvider);

    const modelSections = [
      'model-fields',
      'model-i18n',
      'model-metadata',
      'model-capabilities',
      'model-modalities',
      'model-limits',
      'model-pricing',
    ];

    modelSections.forEach((id) => LayoutManager.toggleVisibility(id, isProvider));
    LayoutManager.setMode(ValueUtils.getAction());
  },

  /**
   * Toggle form mode (single/batch)
   */
  toggleMode() {
    const isBatch = ValueUtils.getMode() === CONSTANTS.MODES.BATCH;

    const singleSections = [
      'submission-type-section',
      'single-mode',
      'provider-fields',
      'provider-i18n',
      'model-fields',
      'model-i18n',
      'model-metadata',
      'model-capabilities',
      'model-modalities',
      'model-limits',
      'model-pricing',
    ];

    singleSections.forEach((id) => LayoutManager.toggleVisibility(id, isBatch));
    LayoutManager.toggleVisibility('batch-mode', !isBatch);

    if (isBatch) {
      // Ensure preview renders when switching to batch mode
      BatchPreview.update();
    } else {
      LayoutManager.toggleSubmissionType();
    }
  },
};
