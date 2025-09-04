/**
 * Core Actions
 * Main user actions and operations
 */

import { Validation } from '../validation/index.js';
import { IssueManager } from '../issue/index.js';
import { StatusManager } from '../ui/status.js';
import { I18N } from '../i18n/index.js';
import { TextUtils } from '../utils/text.js';
import { CONSTANTS } from '../config/constants.js';

export const CoreActions = {
  /**
   * Open GitHub issue
   */
  openIssue() {
    const validation = Validation.ensureValidBeforeSubmit();
    if (!validation.valid) {
      StatusManager.setStatus(validation.error, true);
      return;
    }

    const { title, body } = IssueManager.buildIssue();
    const fullUrl = IssueManager.createGitHubUrl(title, body);

    if (fullUrl.length > CONSTANTS.GITHUB.MAX_URL_LENGTH) {
      // URL too long, copy body to clipboard and open short URL
      navigator.clipboard?.writeText(body);
      StatusManager.setStatus(I18N.t('copyHint'));
      const shortUrl = IssueManager.createGitHubUrl(title, '');
      window.open(shortUrl, '_blank');
    } else {
      window.open(fullUrl, '_blank');
    }
  },

  /**
   * Copy issue body to clipboard
   */
  copyBody() {
    const validation = Validation.ensureValidBeforeSubmit();
    if (!validation.valid) {
      StatusManager.setStatus(validation.error, true);
      return;
    }

    const { body } = IssueManager.buildIssue();
    const normalizedBody = TextUtils.normalizeIssueBody(body);
    navigator.clipboard?.writeText(normalizedBody);
    StatusManager.setStatus(I18N.t('copied'));
  },
};
