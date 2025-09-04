/**
 * Text Processing Utilities
 * Pure functions for text normalization and formatting
 */

export const TextUtils = {
  /**
   * Normalize issue body for GitHub
   */
  normalizeIssueBody(content) {
    let s = String(content || '').replace(/\r\n?|\u000d/gi, '\n');

    // Code fences
    s = s.replace(/\n```/g, '\n\n```');
    s = s.replace(/```\n(?!\n)/g, '```\n\n');

    // Details blocks
    s = s.replace(/<details>\n(?!\n)/g, '<details>\n\n');
    s = s.replace(/\n<\/details>/g, '\n\n</details>');

    // Horizontal rules
    s = s.replace(/\n---\n?/g, '\n\n---\n\n');

    return s;
  },
};
