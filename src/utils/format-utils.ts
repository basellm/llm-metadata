/** 格式化工具函数 */

import { ModelCost } from '../types/index.js';

/** 将 token 数量格式化为 K/M 形式 */
export function formatTokensToKM(tokens?: number): string | null {
  if (!tokens || typeof tokens !== 'number' || tokens <= 0) {
    return null;
  }

  if (tokens >= 1000000) {
    const millions = tokens / 1000000;
    return Number.isInteger(millions) ? `${millions}M` : `${Number(millions.toFixed(1))}M`;
  }

  if (tokens >= 1000) {
    const thousands = tokens / 1000;
    return Number.isInteger(thousands) ? `${thousands}K` : `${Number(thousands.toFixed(1))}K`;
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
  cache_write?: number;
}): string {
  if (!cost?.input) return '-';

  const input = cost.input;
  const output = cost.output || '-';
  const cacheRead = cost.cache_read ? `<br/>Cache Read: $${cost.cache_read}` : '';
  const cacheWrite = cost.cache_write ? `<br/>Cache Write: $${cost.cache_write}` : '';

  return `In: $${input}<br/>Out: $${output}${cacheRead}${cacheWrite}`;
}

/** 格式化能力标志 */
export function formatCapabilities(model: {
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  temperature?: boolean;
  image?: boolean;
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

/** 构建模型标签字符串 */
export function buildModelTags(model: any, map?: Record<string, string>): string[] {
  const tagSet = new Set<string>();
  const translate = (key: string) => (map && map[key]) || key;

  // 处理显式标签
  if (Array.isArray(model.tags)) {
    for (const tag of model.tags) {
      if (tag) tagSet.add(translate(String(tag).trim()));
    }
  } else if (typeof model.tags === 'string') {
    model.tags.split(/[;,\s]+/g).forEach((tag: string) => {
      const t = tag.trim();
      if (t) tagSet.add(translate(t));
    });
  }

  // 基于能力添加标签
  if (model.reasoning) tagSet.add(translate('reasoning'));
  if (model.tool_call) tagSet.add(translate('tools'));
  if (model.attachment) tagSet.add(translate('files'));
  if (model.open_weights) tagSet.add(translate('open_weights'));

  // 基于模态添加标签
  const inputMods = model.modalities?.input || [];
  const outputMods = model.modalities?.output || [];
  const allMods = [...inputMods, ...outputMods];

  if (allMods.includes('image')) tagSet.add(translate('vision'));
  if (allMods.includes('audio')) tagSet.add(translate('audio'));

  // 添加上下文窗口标签
  const contextLimit = model.limit?.context;
  const contextTag = formatTokensToKM(contextLimit);
  if (contextTag) tagSet.add(translate(contextTag));

  return Array.from(tagSet);
}

export function buildModelPriceInfo(cost?: ModelCost) {
  const input = typeof cost?.input === 'number' && cost!.input > 0 ? cost!.input : null;
  const output = typeof cost?.output === 'number' && cost!.output > 0 ? cost!.output : null;
  const cacheRead =
    typeof cost?.cache_read === 'number' && cost!.cache_read > 0 ? cost!.cache_read : null;
  const cacheWrite =
    typeof cost?.cache_write === 'number' && cost!.cache_write > 0 ? cost!.cache_write : null;
  return { input, output, cacheRead, cacheWrite };
}
