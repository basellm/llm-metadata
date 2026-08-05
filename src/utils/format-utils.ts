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

/** 从对象中提取所有数字类型的字段 */
function extractNumericFields(obj: Record<string, any>): [string, number][] {
  return Object.entries(obj)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => [key, value as number]);
}

/** 定价字段配置（按优先级排序） */
const PRICING_FIELD_CONFIGS: FieldConfig[] = [
  // 1. 基础 input/output 字段
  {
    keys: ['input', 'output'],
    priority: 1,
    formatter: (cost, symbol) => {
      const output = cost.output !== undefined ? formatPrice(symbol, cost.output) : '-';
      return [`Input: ${formatPrice(symbol, cost.input!)}<br/>Output: ${output}`];
    },
  },
  // 2. 多模态字段
  {
    keys: ['text_input', 'vision_input', 'audio_input'],
    priority: 2,
    formatter: (cost, symbol) => {
      const lines: string[] = [];
      const inputs: [string, keyof ModelCost, string][] = [
        ['Text Input', 'text_input', ''],
        ['Vision Input', 'vision_input', ''],
        ['Audio Input', 'audio_input', ''],
      ];
      inputs.forEach(([label, key]) => {
        if (cost[key] !== undefined)
          lines.push(`${label}: ${formatPrice(symbol, cost[key] as number)}`);
      });

      // 多模态输出
      const outputs: [string, keyof ModelCost][] = [
        ['Output', 'multi_output'],
        ['Multi Output', 'multiin_text_output'],
        ['Pure Output', 'purein_text_output'],
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

/** 所有已知的显式字段（从配置自动生成） */
const KNOWN_FIELDS = (() => {
  const fields = new Set<string>();
  PRICING_FIELD_CONFIGS.forEach((config) => {
    config.keys.forEach((key) => fields.add(key));
  });
  return fields;
})();

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

  // 显示所有其他数字字段（包括 cache、分层定价、推理模式等）
  const otherFields = extractNumericFields(cost)
    .filter(([key]) => !KNOWN_FIELDS.has(key))
    .sort(([a], [b]) => a.localeCompare(b)); // 按字段名排序

  otherFields.forEach(([key, value]) => {
    lines.push(`${formatFieldName(key)}: ${formatPrice(symbol, value)}`);
  });

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

/** 货币换算结果 */
export interface UsdCostResult {
  /** 换算为 USD 后的成本（原始即 USD 时原样返回；无法换算时为 undefined） */
  cost?: ModelCost;
  /** 无法换算的货币代码（缺少汇率时返回） */
  unknownCurrency?: string;
}

/**
 * 将成本对象规范化为 USD。
 * NewAPI 的倍率体系以 USD 为基准（1 = $0.002/1K tokens），
 * 非 USD 价格若不换算会产生错误倍率。
 */
export function normalizeCostToUSD(
  cost: ModelCost | undefined,
  exchangeRates: Record<string, number>,
): UsdCostResult {
  if (!cost) return {};

  const currency = cost.currency || 'USD';
  if (currency === 'USD') return { cost };

  const rate = exchangeRates[currency];
  if (typeof rate !== 'number' || rate <= 0) {
    return { unknownCurrency: currency };
  }

  const converted: ModelCost = { currency: 'USD' };
  for (const [key, value] of Object.entries(cost)) {
    if (key === 'currency') continue;
    converted[key] = typeof value === 'number' ? Number((value / rate).toPrecision(6)) : value;
  }
  return { cost: converted };
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

/** 获取最高价格（用于 NewAPI 比率计算） */
export function getMaxPrices(cost?: ModelCost): {
  maxInput: number | null;
  maxOutput: number | null;
  maxCacheRead: number | null;
} {
  if (!cost) {
    return { maxInput: null, maxOutput: null, maxCacheRead: null };
  }

  const numericFields = extractNumericFields(cost);

  // 收集所有 input 相关字段
  const inputFields = numericFields
    .filter(
      ([key]) => key === 'input' || key.startsWith('input_') || key.startsWith('thinking_input'),
    )
    .map(([, value]) => value);

  // 收集所有 output 相关字段
  const outputFields = numericFields
    .filter(
      ([key]) => key === 'output' || key.startsWith('output_') || key.startsWith('thinking_output'),
    )
    .map(([, value]) => value);

  // 收集所有 cache_read 相关字段
  const cacheReadFields = numericFields
    .filter(
      ([key]) =>
        key === 'cache_read' ||
        key.startsWith('cache_read_') ||
        key.startsWith('thinking_cache_read'),
    )
    .map(([, value]) => value);

  return {
    maxInput: inputFields.length > 0 ? Math.max(...inputFields) : null,
    maxOutput: outputFields.length > 0 ? Math.max(...outputFields) : null,
    maxCacheRead: cacheReadFields.length > 0 ? Math.max(...cacheReadFields) : null,
  };
}
