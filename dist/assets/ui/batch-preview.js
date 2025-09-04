/**
 * Batch Preview Management
 * Batch mode preview and validation display
 */

import { DOMUtils } from '../utils/dom.js';
import { BatchValidation } from '../validation/batch.js';
import { I18N } from '../i18n/index.js';
import { EnvConfig } from '../config/env.js';
import { StatusManager } from './status.js';

export const BatchPreview = {
  /**
   * Update batch preview display
   */
  update() {
    const { valid, items, error } = BatchValidation.parseAndValidate();

    DOMUtils.setText('batch-count', String(items.length || 0));

    if (!valid) {
      StatusManager.setOpenIssueEnabled(false);
      StatusManager.setStatus(error, true);

      const previewContent =
        error === I18N.t('batchCannotBeEmpty')
          ? `<div style="color: #9ca3af;">${I18N.t('noData')}</div>`
          : `<div style="color: #ef4444;">${error}</div>`;

      DOMUtils.setHTML('batch-list', previewContent);
      return;
    }

    StatusManager.setOpenIssueEnabled(true);
    StatusManager.setStatus('');

    const itemsHtml = items
      .map((item, i) => {
        const action = item.action === 'update' ? I18N.t('update') : I18N.t('create');
        const lang = EnvConfig.getCurrentLang();
        const name = (item.i18n?.name?.[lang] || item.i18n?.name?.en || '').trim();

        if (item.schema === 'provider-submission') {
          const providerId = item.id || '';
          return `<div style="margin-bottom: 4px;"><strong>${i + 1}.</strong> ${action} ${I18N.t('provider')} <code>${providerId}</code> ${name ? `(${name})` : ''}</div>`;
        } else {
          const prov = item.providerId || '';
          const model = item.id || item.modelId || '';
          return `<div style="margin-bottom: 4px;"><strong>${i + 1}.</strong> ${action} ${I18N.t('model')} <code>${prov}/${model}</code> ${name ? `(${name})` : ''}</div>`;
        }
      })
      .join('');

    DOMUtils.setHTML(
      'batch-list',
      itemsHtml || `<div style="color: #9ca3af;">${I18N.t('noData')}</div>`,
    );
  },
};
