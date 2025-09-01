/** 格式化工具函数 */

/** 将 token 数量格式化为 K/M 形式 */
export function formatTokensToKM(tokens?: number): string | null {
  if (!tokens || typeof tokens !== 'number' || tokens <= 0) {
    return null;
  }

  if (tokens >= 1000000) {
    const millions = tokens / 1000000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }

  if (tokens >= 1000) {
    const thousands = tokens / 1000;
    return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
  }

  return tokens.toString();
}

/** 转义 Markdown 管道符 */
export function escapeMarkdownPipes(text?: string): string {
  return (text || '').replace(/\|/g, '\\|');
}

/** 格式化定价信息 */
export function formatPricing(cost?: {
  input?: number;
  output?: number;
  cache_read?: number;
}): string {
  if (!cost?.input) return '-';

  const input = cost.input;
  const output = cost.output || '-';
  const cache = cost.cache_read ? `<br/>Cache: ${cost.cache_read}` : '';

  return `In: ${input}<br/>Out: ${output}${cache}`;
}

/** 格式化能力标志 */
export function formatCapabilities(model: {
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  temperature?: boolean;
}): string {
  const emojis = [];
  if (model.attachment) emojis.push('📎');
  if (model.reasoning) emojis.push('🧠');
  if (model.tool_call) emojis.push('🔧');
  if (model.temperature) emojis.push('🌡️');

  return emojis.length > 0 ? emojis.join(' ') : '-';
}

/** 格式化模态信息 */
export function formatModalities(modalities?: { input?: string[]; output?: string[] }): string {
  const inputMods = modalities?.input?.join(', ') || 'text';
  const outputMods = modalities?.output?.join(', ') || 'text';
  return `In: ${inputMods}<br/>Out: ${outputMods}`;
}

/** 格式化额外详情 */
export function formatDetails(model: {
  open_weights?: boolean;
  release_date?: string;
  last_updated?: string;
}): string {
  const details = [];
  if (model.open_weights) details.push('Open Weights');
  if (model.release_date) details.push(`Released: ${model.release_date}`);
  if (model.last_updated && model.last_updated !== model.release_date) {
    details.push(`Updated: ${model.last_updated}`);
  }

  return details.length > 0 ? details.join('<br/>') : '-';
}

/** 格式化限制信息 */
export function formatLimit(value?: number): string {
  const formatted = formatTokensToKM(value);
  return formatted || '-';
}
