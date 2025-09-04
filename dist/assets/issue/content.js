/**
 * Issue Content Generation
 * Generate content for GitHub issues
 */

import { I18N } from '../i18n/index.js';
import { CONSTANTS } from '../config/constants.js';
import { EnvConfig } from '../config/env.js';

export const ContentGenerator = {
  /**
   * Build item list for batch submissions
   */
  buildBatchItemList(items) {
    return items
      .map((item, i) => {
        const action =
          item.action === CONSTANTS.ACTIONS.UPDATE ? I18N.t('update') : I18N.t('create');

        const lang = EnvConfig.getCurrentLang();
        const name =
          item.i18n?.name?.[lang] || item.i18n?.name?.en
            ? ` - ${item.i18n.name[lang] || item.i18n.name.en}`
            : '';

        if (item.schema === CONSTANTS.SCHEMAS.PROVIDER_SUBMISSION) {
          const providerId = item.id || '';
          return `${i + 1}. **${action}** Provider \`${providerId}\`${name}`;
        } else {
          const prov = item.providerId || '';
          const model = item.id || item.modelId || '';
          return `${i + 1}. **${action}** Model \`${prov}/${model}\`${name}`;
        }
      })
      .join('\n');
  },

  /**
   * Build content for single submission
   */
  buildSingle(item) {
    const action = item.action === CONSTANTS.ACTIONS.UPDATE ? I18N.t('update') : I18N.t('create');
    const actionIcon = item.action === CONSTANTS.ACTIONS.UPDATE ? '✏️' : '➕';

    let requestType, infoSection, infoFields;

    if (item.schema === CONSTANTS.SCHEMAS.PROVIDER_SUBMISSION) {
      requestType =
        item.action === CONSTANTS.ACTIONS.UPDATE
          ? I18N.t('updateProviderRequest')
          : I18N.t('createProviderRequest');
      infoSection = I18N.t('providerInfo');
      infoFields = [
        `- **${I18N.t('providerId')}**: \`${item.id ?? ''}\``,
        item.i18n?.name?.en ? `- **${I18N.t('displayName')}**: ${item.i18n.name.en}` : '',
        item.i18n?.description?.en
          ? `- **${I18N.t('description')}**: ${item.i18n.description.en}`
          : '',
        item.api ? `- **API**: ${item.api}` : '',
        item.lobeIcon ? `- **Lobe Icon**: ${item.lobeIcon}` : '',
      ].filter(Boolean);
    } else {
      requestType =
        item.action === CONSTANTS.ACTIONS.UPDATE
          ? I18N.t('updateModelRequest')
          : I18N.t('createModelRequest');
      infoSection = I18N.t('modelInfo');
      infoFields = [
        `- **${I18N.t('provider')}**: \`${item.providerId ?? ''}\``,
        `- **${I18N.t('modelId')}**: \`${item.id ?? ''}\``,
        item.i18n?.name?.en ? `- **${I18N.t('displayName')}**: ${item.i18n.name.en}` : '',
        item.i18n?.description?.en
          ? `- **${I18N.t('description')}**: ${item.i18n.description.en}`
          : '',
      ].filter(Boolean);
    }

    return [
      `${actionIcon} **${requestType}**`,
      '',
      I18N.t('issueIntroSingle'),
      '',
      `## 📋 ${infoSection}`,
      ...infoFields,
      `- **${I18N.t('actionType')}**: ${action}`,
      '',
      `## 🔧 ${I18N.t('techInfo')}`,
      '<details>',
      '<summary>Complete Configuration Data</summary>',
      '',
      '```json',
      JSON.stringify(item, null, 2),
      '```',
      '',
      '</details>',
      '',
      '',
      '---',
      '',
      `*${I18N.t('issueFooterSingle')}*`,
    ].filter(Boolean);
  },

  /**
   * Build content for batch submission
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

    return [
      `🚀 **${I18N.t('batchSubmissionRequest')}**`,
      '',
      I18N.t('issueIntroBatch'),
      '',
      `## 📋 ${I18N.t('submissionSummary')}`,
      `- **${I18N.t('totalCount')}**: ${summaryText}`,
      `- **${I18N.t('mode')}**: ${I18N.t('batchProcessing')}`,
      '',
      `## 📝 Details`,
      this.buildBatchItemList(items),
      '',
      `## 🔧 ${I18N.t('techInfo')}`,
      '<details>',
      '<summary>Complete JSON Data</summary>',
      '',
      '```json',
      JSON.stringify(items, null, 2),
      '```',
      '',
      '</details>',
      '',
      '',
      '---',
      '',
      `*${I18N.t('issueFooterBatch')}*`,
    ].filter(Boolean);
  },
};
