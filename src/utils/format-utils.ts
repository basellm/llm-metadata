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

/** 获取货币符号 */
function getCurrencySymbol(currency?: 'CNY' | 'USD' | 'EUR'): string {
  const symbols = { CNY: '¥', EUR: '€', USD: '$' };
  return symbols[currency || 'USD'];
}

/** 格式化字段名称（将 snake_case 转为 Title Case） */
function formatFieldName(field: string): string {
  return field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** 格式化价格值 */
function formatPrice(symbol: string, value: number, suffix = ''): string {
  return `${symbol}${value}${suffix}`;
}

/** 字段配置类型 */
interface FieldConfig {
  keys: string[];
  formatter: (cost: ModelCost, symbol: string) => string[];
  priority: number;
}

/** 定价字段配置（按优先级排序） */
const PRICING_FIELD_CONFIGS: FieldConfig[] = [
  // 1. 基础 input/output 字段
  {
    keys: ['input'],
    priority: 1,
    formatter: (cost, symbol) => {
      const output = cost.output !== undefined ? formatPrice(symbol, cost.output) : '-';
      return [`In: ${formatPrice(symbol, cost.input!)}<br/>Out: ${output}`];
    },
  },
  // 2. 多模态字段
  {
    keys: ['text_input', 'vision_input', 'audio_input'],
    priority: 2,
    formatter: (cost, symbol) => {
      const lines: string[] = [];
      const inputs: [string, keyof ModelCost, string][] = [
        ['Text In', 'text_input', ''],
        ['Vision In', 'vision_input', ''],
        ['Audio In', 'audio_input', ''],
      ];
      inputs.forEach(([label, key]) => {
        if (cost[key] !== undefined)
          lines.push(`${label}: ${formatPrice(symbol, cost[key] as number)}`);
      });

      // 多模态输出
      const outputs: [string, keyof ModelCost][] = [
        ['Out', 'multi_output'],
        ['Multi Out', 'multiin_text_output'],
        ['Pure Out', 'purein_text_output'],
      ];
      for (const [label, key] of outputs) {
        if (cost[key] !== undefined) {
          lines.push(`${label}: ${formatPrice(symbol, cost[key] as number)}`);
          break;
        }
      }
      return lines;
    },
  },
  // 3. 嵌入模型
  {
    keys: ['embedding_text', 'embedding_image'],
    priority: 3,
    formatter: (cost, symbol) => {
      const fields: [string, keyof ModelCost][] = [
        ['Text', 'embedding_text'],
        ['Image', 'embedding_image'],
      ];
      return fields
        .filter(([, key]) => cost[key] !== undefined)
        .map(([label, key]) => `${label}: ${formatPrice(symbol, cost[key] as number, '/1K')}`);
    },
  },
  // 4. 按单位计费
  {
    keys: ['per_second', 'per_10k_chars', 'per_image'],
    priority: 4,
    formatter: (cost, symbol) => {
      const units: [keyof ModelCost, string][] = [
        ['per_second', '/s'],
        ['per_10k_chars', '/10K chars'],
        ['per_image', '/img'],
      ];
      for (const [key, unit] of units) {
        if (cost[key] !== undefined) {
          return [formatPrice(symbol, cost[key] as number, unit)];
        }
      }
      return [];
    },
  },
  // 5. 特殊字段
  {
    keys: ['text', 'vl'],
    priority: 5,
    formatter: (cost, symbol) => {
      const fields: [string, keyof ModelCost, string][] = [
        ['Text', 'text', ''],
        ['VL', 'vl', '/1K'],
      ];
      return fields
        .filter(([, key]) => cost[key] !== undefined)
        .map(
          ([label, key, suffix]) => `${label}: ${formatPrice(symbol, cost[key] as number, suffix)}`,
        );
    },
  },
];

/** 格式化定价信息 */
export function formatPricing(cost?: ModelCost): string {
  if (!cost) return '-';

  const symbol = getCurrencySymbol(cost.currency);
  const lines: string[] = [];

  // 按优先级匹配字段配置
  for (const config of PRICING_FIELD_CONFIGS) {
    const hasAnyKey = config.keys.some((key) => cost[key as keyof ModelCost] !== undefined);
    if (hasAnyKey) {
      lines.push(...config.formatter(cost, symbol));
      break;
    }
  }

  // 添加缓存字段（作为补充信息）
  const cacheFields: [string, keyof ModelCost][] = [
    ['Cache Read', 'cache_read'],
    ['Cache Write', 'cache_write'],
  ];
  cacheFields.forEach(([label, key]) => {
    if (cost[key] !== undefined) {
      lines.push(`${label}: ${formatPrice(symbol, cost[key] as number)}`);
    }
  });

  // 如果没有匹配到任何已知字段，显示动态字段
  if (lines.length === 0) {
    const dynamicFields = Object.entries(cost).filter(
      ([key, value]) => key !== 'currency' && typeof value === 'number',
    );

    dynamicFields.slice(0, 3).forEach(([key, value]) => {
      lines.push(`${formatFieldName(key)}: ${formatPrice(symbol, value as number)}`);
    });
  }

  return lines.length > 0 ? lines.join('<br/>') : '-';
}

/** 能力模型类型 */
type CapabilityModel = {
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  temperature?: boolean;
  image?: boolean;
};

/** 能力标志映射 */
const CAPABILITY_EMOJIS: [keyof CapabilityModel, string][] = [
  ['attachment', '📎'],
  ['reasoning', '🧠'],
  ['tool_call', '🔧'],
  ['temperature', '🌡️'],
];

/** 格式化能力标志 */
export function formatCapabilities(model: CapabilityModel): string {
  const emojis = CAPABILITY_EMOJIS.filter(([key]) => model[key]).map(([, emoji]) => emoji);

  return emojis.length > 0 ? emojis.join(' ') : '-';
}

/** 格式化模态信息 */
export function formatModalities(modalities?: { input?: string[]; output?: string[] }): string {
  const formatMods = (mods?: string[]) => mods?.join(', ') || 'text';
  return `In: ${formatMods(modalities?.input)}<br/>Out: ${formatMods(modalities?.output)}`;
}

/** 格式化额外详情 */
export function formatDetails(model: {
  open_weights?: boolean;
  release_date?: string;
  last_updated?: string;
}): string {
  const details: string[] = [];

  if (model.open_weights) details.push('Open Weights');
  if (model.release_date) details.push(`Released: ${model.release_date}`);
  if (model.last_updated && model.last_updated !== model.release_date) {
    details.push(`Updated: ${model.last_updated}`);
  }

  return details.length > 0 ? details.join('<br/>') : '-';
}

/** 格式化限制信息 */
export function formatLimit(value?: number): string {
  return formatTokensToKM(value) || '-';
}

/** 能力到标签的映射 */
const CAPABILITY_TAG_MAPPINGS: [string, string][] = [
  ['reasoning', 'reasoning'],
  ['tool_call', 'tools'],
  ['attachment', 'files'],
  ['open_weights', 'open_weights'],
];

/** 模态到标签的映射 */
const MODALITY_TAG_MAPPINGS: [string, string][] = [
  ['image', 'vision'],
  ['audio', 'audio'],
];

/** 构建模型标签字符串 */
export function buildModelTags(model: any, map?: Record<string, string>): string[] {
  const tagSet = new Set<string>();
  const translate = (key: string) => map?.[key] ?? key;

  // 处理显式标签
  const tags = Array.isArray(model.tags)
    ? model.tags
    : typeof model.tags === 'string'
      ? model.tags.split(/[;,\s]+/g)
      : [];

  tags.forEach((tag: any) => {
    const trimmed = String(tag).trim();
    if (trimmed) tagSet.add(translate(trimmed));
  });

  // 基于能力添加标签
  CAPABILITY_TAG_MAPPINGS.forEach(([capability, tag]) => {
    if (model[capability]) tagSet.add(translate(tag));
  });

  // 基于模态添加标签
  const allMods = [...(model.modalities?.input || []), ...(model.modalities?.output || [])];

  MODALITY_TAG_MAPPINGS.forEach(([modality, tag]) => {
    if (allMods.includes(modality)) tagSet.add(translate(tag));
  });

  // 添加上下文窗口标签
  const contextTag = formatTokensToKM(model.limit?.context);
  if (contextTag) tagSet.add(translate(contextTag));

  return Array.from(tagSet);
}

/** 提取有效价格值（辅助函数） */
function extractValidPrice(value?: number): number | null {
  return typeof value === 'number' && value > 0 ? value : null;
}

/** 构建模型价格信息 */
export function buildModelPriceInfo(cost?: ModelCost) {
  return {
    input: extractValidPrice(cost?.input),
    output: extractValidPrice(cost?.output),
    cacheRead: extractValidPrice(cost?.cache_read),
    cacheWrite: extractValidPrice(cost?.cache_write),
  };
}
