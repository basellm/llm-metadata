/**
 * GitHub Integration
 * GitHub URL creation and integration utilities
 */

import { EnvConfig } from '../config/env.js';
import { CONSTANTS } from '../config/constants.js';
import { TextUtils } from '../utils/text.js';

export const GitHubIntegration = {
  /**
   * Create GitHub issue URL
   */
  createIssueUrl(title, body) {
    const repo = EnvConfig.getRepository();
    const url = new URL(`https://github.com/${repo}/issues/new`);

    const normalizedBody = TextUtils.normalizeIssueBody(body);
    const params = new URLSearchParams({
      title,
      body: normalizedBody,
      labels: CONSTANTS.GITHUB.ISSUE_LABEL,
    });

    url.search = params.toString();
    return url.toString();
  },
};
