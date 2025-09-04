/**
 * Issue Module
 * Main issue generation and management
 */

import { ValueUtils, ObjectUtils } from '../utils/index.js';
import { CONSTANTS } from '../config/constants.js';
import { TitleGenerator } from './titles.js';
import { ContentGenerator } from './content.js';
import { GitHubIntegration } from './github.js';
import { FieldManager } from '../ui/fields.js';
import { BatchPreview } from '../ui/batch-preview.js';
import { batchTemplate } from './templates/batch.js';

export const IssueManager = {
  /**
   * Build payload from form data
   */
  buildPayload() {
    const mode = ValueUtils.getMode();
    const submissionType = ValueUtils.getSubmissionType();

    if (mode === CONSTANTS.MODES.BATCH) {
      try {
        const batchText = ValueUtils.value('batch-json');
        if (!batchText) return [];
        const parsed = JSON.parse(batchText);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (_) {
        return [];
      }
    }

    if (submissionType === CONSTANTS.SUBMISSION_TYPES.PROVIDER) {
      return ObjectUtils.prune({
        schema: CONSTANTS.SCHEMAS.PROVIDER_SUBMISSION,
        action: ValueUtils.getAction(),
        id: ValueUtils.value('provider-id') || undefined,
        api: ValueUtils.value('provider-api') || undefined,
        iconURL: ValueUtils.value('provider-icon-url') || undefined,
        lobeIcon: ValueUtils.value('provider-lobe-icon') || undefined,
        i18n: {
          name: {
            en: ValueUtils.value('provider-i18n-name-en') || undefined,
            zh: ValueUtils.value('provider-i18n-name-zh') || undefined,
            ja: ValueUtils.value('provider-i18n-name-ja') || undefined,
          },
          description: {
            en: ValueUtils.value('provider-i18n-desc-en') || undefined,
            zh: ValueUtils.value('provider-i18n-desc-zh') || undefined,
            ja: ValueUtils.value('provider-i18n-desc-ja') || undefined,
          },
        },
      });
    } else {
      return ObjectUtils.prune({
        schema: CONSTANTS.SCHEMAS.MODEL_SUBMISSION,
        action: ValueUtils.getAction(),
        providerId: ValueUtils.value('providerId') || undefined,
        id: ValueUtils.value('id') || undefined,
        i18n: {
          name: {
            en: ValueUtils.value('i18n-name-en') || undefined,
            zh: ValueUtils.value('i18n-name-zh') || undefined,
            ja: ValueUtils.value('i18n-name-ja') || undefined,
          },
          description: {
            en: ValueUtils.value('i18n-desc-en') || undefined,
            zh: ValueUtils.value('i18n-desc-zh') || undefined,
            ja: ValueUtils.value('i18n-desc-ja') || undefined,
          },
        },
        reasoning: ValueUtils.checked('cap-reasoning') || undefined,
        tool_call: ValueUtils.checked('cap-tools') || undefined,
        attachment: ValueUtils.checked('cap-files') || undefined,
        temperature: ValueUtils.checked('cap-temp') || undefined,
        knowledge: ValueUtils.value('knowledge') || undefined,
        release_date: ValueUtils.value('release-date') || undefined,
        last_updated: ValueUtils.value('last-updated') || undefined,
        open_weights: ValueUtils.checked('cap-open-weights') || undefined,
        modalities: {
          input: ValueUtils.gather('mod-in'),
          output: ValueUtils.gather('mod-out'),
        },
        limit: {
          context: ValueUtils.num('limit-context'),
          output: ValueUtils.num('limit-output'),
        },
        cost: {
          input: ValueUtils.num('cost-input'),
          output: ValueUtils.num('cost-output'),
          cache_read: ValueUtils.num('cost-cache-read'),
          cache_write: ValueUtils.num('cost-cache-write'),
        },
      });
    }
  },

  /**
   * Build complete issue (title and body)
   */
  buildIssue() {
    const payload = this.buildPayload();
    const mode = ValueUtils.getMode();

    if (mode === CONSTANTS.MODES.BATCH && Array.isArray(payload)) {
      const title = TitleGenerator.buildBatch(payload);
      const body = ContentGenerator.buildBatch(payload).join('\n');
      return { title, body };
    } else {
      const single = Array.isArray(payload) ? payload[0] || {} : payload;
      const title = TitleGenerator.buildSingle(single);
      const body = ContentGenerator.buildSingle(single).join('\n');
      return { title, body };
    }
  },

  /**
   * Create GitHub issue URL
   */
  createGitHubUrl(title, body) {
    return GitHubIntegration.createIssueUrl(title, body);
  },

  /**
   * Insert batch template
   */
  insertBatchTemplate() {
    FieldManager.setValue('batch-json', JSON.stringify(batchTemplate, null, 2));
    // Programmatic value set does not trigger 'input' event; refresh preview manually
    BatchPreview.update();
  },
};
