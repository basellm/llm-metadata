import type { ModelCost } from './api';
import { currencySymbol, formatContext, formatMoney } from './format';
import type { MessageKey, Translator } from './i18n';

/** 价格列（与主表列对齐） */
export type PriceColumn = 'input' | 'cacheRead' | 'cacheWrite' | 'output';

export type PriceCells = Record<PriceColumn, number | null>;

export interface DetailRow extends PriceCells {
  label: string;
}

export interface DetailSection {
  title: string;
  rows: DetailRow[];
}

/** 模型价格：主行摘要 + 二级明细分组 */
export interface ModelPricing {
  symbol: string;
  base: PriceCells;
  /** 非 token 计费摘要（如 "¥0.08/s"），仅当无 token 输入价时用于主行 */
  unit: string | null;
  tiered: boolean;
  thinking: boolean;
  sections: DetailSection[];
}

const EMPTY_CELLS: PriceCells = { input: null, cacheRead: null, cacheWrite: null, output: null };

const FAMILY_TO_COLUMN: Record<string, PriceColumn> = {
  input: 'input',
  output: 'output',
  cache_read: 'cacheRead',
  cache_write: 'cacheWrite',
};

/** 已知复合费率键 → 行标签消息键与所属列 */
const KNOWN_RATES: Record<string, { labelKey: MessageKey; column: PriceColumn }> = {
  text_input: { labelKey: 'pricing.text', column: 'input' },
  text: { labelKey: 'pricing.text', column: 'input' },
  vision_input: { labelKey: 'pricing.vision', column: 'input' },
  vl: { labelKey: 'pricing.vision', column: 'input' },
  audio_input: { labelKey: 'pricing.audio', column: 'input' },
  input_audio: { labelKey: 'pricing.audio', column: 'input' },
  output_audio: { labelKey: 'pricing.audio', column: 'output' },
  audio_output: { labelKey: 'pricing.audio', column: 'output' },
  multiin_text_output: { labelKey: 'pricing.textOutputMultimodal', column: 'output' },
  purein_text_output: { labelKey: 'pricing.textOutputTextOnly', column: 'output' },
  multi_output: { labelKey: 'pricing.multimodalOutput', column: 'output' },
  embedding_text: { labelKey: 'pricing.embeddingText', column: 'input' },
  embedding_image: { labelKey: 'pricing.embeddingImage', column: 'input' },
  text_input_cache: { labelKey: 'pricing.text', column: 'cacheRead' },
  audio_input_cache: { labelKey: 'pricing.audio', column: 'cacheRead' },
  vision_input_cache: { labelKey: 'pricing.vision', column: 'cacheRead' },
  reasoning: { labelKey: 'pricing.reasoningMode', column: 'output' },
};

const TIER_KEY_RE =
  /^(thinking_)?(input|output|cache_read|cache_write)_(\d+(?:\.\d+)?[km])_(\d+(?:\.\d+)?[km])$/;

/** '32k' → 32000, '1m' → 1000000（仅用于排序与阈值标签） */
function parseBound(raw: string): number {
  const value = parseFloat(raw);
  return raw.endsWith('m') ? value * 1_000_000 : value * 1_000;
}

/** per_* 键 → 行标签（"Per second · 1080p"、"Per 10K characters"） */
function unitLabel(key: string, t: Translator): string {
  if (key === 'per_10k_chars') return t('pricing.per10kChars');
  if (key === 'per_image') return t('pricing.perImage');
  if (key === 'per_second') return t('pricing.perSecond');
  if (key.startsWith('per_second_')) {
    const variant = key.slice('per_second_'.length).replace(/(\d)x(\d)/g, '$1×$2');
    return t('pricing.perSecondVariant', { variant });
  }
  return humanizeKey(key);
}

/** per_* 键 → 摘要用短单位（"/s"、"/10K chars"） */
function unitSuffix(key: string, t: Translator): string {
  if (key.startsWith('per_second')) return t('pricing.suffixPerSecond');
  if (key === 'per_10k_chars') return t('pricing.suffixPer10kChars');
  if (key === 'per_image') return t('pricing.suffixPerImage');
  return '';
}

/** 未知键兜底标签："foo_bar_128k" → "Foo bar 128K" */
function humanizeKey(key: string): string {
  const words = key
    .replace(/_/g, ' ')
    .replace(/(\d)x(\d)/g, '$1×$2')
    .replace(/\b(\d+(?:\.\d+)?)([km])\b/g, (_, n: string, u: string) => `${n}${u.toUpperCase()}`);
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** 有序 label→row 聚合器：同名行自动按列合并，按 sortKey 稳定排序 */
class RowMap {
  private readonly map = new Map<string, { row: DetailRow; sortKey: number }>();

  set(label: string, column: PriceColumn, value: number, sortKey = Number.MAX_SAFE_INTEGER): void {
    let entry = this.map.get(label);
    if (!entry) {
      entry = { row: { label, ...EMPTY_CELLS }, sortKey };
      this.map.set(label, entry);
    }
    entry.row[column] = value;
  }

  rows(): DetailRow[] {
    return [...this.map.values()].sort((a, b) => a.sortKey - b.sortKey).map((entry) => entry.row);
  }

  get size(): number {
    return this.map.size;
  }
}

interface StructuredTier {
  cells: PriceCells;
  threshold: number;
}

function toCells(value: Record<string, unknown>): PriceCells {
  const cells: PriceCells = { ...EMPTY_CELLS };
  for (const [family, column] of Object.entries(FAMILY_TO_COLUMN)) {
    const v = value[family];
    if (typeof v === 'number') cells[column] = v;
  }
  return cells;
}

/**
 * 将 ModelCost 解析为主行摘要 + 明细分组（标签经 t 本地化）。
 * 覆盖三种阶梯表示：键式（input_32k_128k）、tiers 数组（阈值以上生效）、
 * 遗留 context_over_200k（tiers 存在时忽略）；以及思考模式、模态与按量费率。
 */
export function parseModelPricing(cost: ModelCost | undefined, t: Translator): ModelPricing {
  const symbol = currencySymbol(cost?.currency);
  const base: PriceCells = { ...EMPTY_CELLS };
  const contextTiers = new RowMap();
  const thinkingRows = new RowMap();
  const modalityRows = new RowMap();
  const unitRows = new RowMap();

  const thinkingBase: PriceCells = { ...EMPTY_CELLS };
  const structuredTiers: StructuredTier[] = [];
  let legacyOver200k: PriceCells | null = null;
  let minKeyTierBound = Infinity;
  let minThinkingTierBound = Infinity;
  let summaryUnit: { value: number; suffix: string } | null = null;

  for (const [key, value] of Object.entries(cost ?? {})) {
    if (key === 'currency') continue;

    if (key === 'tiers' && Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry !== 'object' || entry === null) continue;
        const record = entry as Record<string, unknown>;
        const tier = record.tier as { size?: number } | undefined;
        if (typeof tier?.size !== 'number') continue;
        structuredTiers.push({ cells: toCells(record), threshold: tier.size });
      }
      continue;
    }

    if (key === 'context_over_200k' && typeof value === 'object' && value !== null) {
      legacyOver200k = toCells(value as Record<string, unknown>);
      continue;
    }

    if (typeof value !== 'number') continue;

    const tierMatch = TIER_KEY_RE.exec(key);
    if (tierMatch) {
      const [, thinkingPrefix, family, lo, hi] = tierMatch;
      const label = `${lo.toUpperCase()} – ${hi.toUpperCase()}`;
      const bound = parseBound(lo);
      const target = thinkingPrefix ? thinkingRows : contextTiers;
      target.set(label, FAMILY_TO_COLUMN[family], value, bound);
      if (thinkingPrefix) minThinkingTierBound = Math.min(minThinkingTierBound, bound);
      else minKeyTierBound = Math.min(minKeyTierBound, bound);
      continue;
    }

    if (key.startsWith('per_')) {
      unitRows.set(unitLabel(key, t), 'input', value);
      const suffix = unitSuffix(key, t);
      if (value > 0 && (!summaryUnit || value < summaryUnit.value)) {
        summaryUnit = { value, suffix };
      }
      continue;
    }

    if (key.startsWith('thinking_')) {
      const rest = key.slice('thinking_'.length);
      const column = FAMILY_TO_COLUMN[rest];
      if (column) {
        thinkingBase[column] = value;
      } else {
        const known = KNOWN_RATES[rest];
        if (known) thinkingRows.set(t(known.labelKey), known.column, value);
        else thinkingRows.set(humanizeKey(rest), 'input', value);
      }
      continue;
    }

    const column = FAMILY_TO_COLUMN[key];
    if (column) {
      base[column] = value;
      continue;
    }

    const known = KNOWN_RATES[key];
    if (known) modalityRows.set(t(known.labelKey), known.column, value);
    else {
      const fallback: PriceColumn = key.includes('output')
        ? 'output'
        : key.includes('cache')
          ? 'cacheRead'
          : 'input';
      modalityRows.set(humanizeKey(key), fallback, value);
    }
  }

  // 结构化阶梯（tiers 数组优先于遗留 context_over_200k，二者表达同一信息）
  const overTiers = structuredTiers.length
    ? structuredTiers
    : legacyOver200k
      ? [{ cells: legacyOver200k, threshold: 200_000 }]
      : [];
  for (const { cells, threshold } of overTiers) {
    const label = `> ${formatContext(threshold)}`;
    for (const column of Object.values(FAMILY_TO_COLUMN)) {
      const v = cells[column];
      if (v !== null) contextTiers.set(label, column, v, threshold + 1);
    }
  }

  // 阶梯首档（基础价所覆盖的区间）
  if (contextTiers.size > 0) {
    const firstBound = structuredTiers.length
      ? Math.min(...structuredTiers.map((t) => t.threshold))
      : legacyOver200k && minKeyTierBound === Infinity
        ? 200_000
        : minKeyTierBound;
    const label = firstBound === Infinity ? t('pricing.base') : `≤ ${formatContext(firstBound)}`;
    for (const column of Object.values(FAMILY_TO_COLUMN)) {
      const v = base[column];
      if (v !== null) contextTiers.set(label, column, v, -1);
    }
  }

  // 思考模式基础行
  if (Object.values(thinkingBase).some((v) => v !== null)) {
    const label =
      minThinkingTierBound === Infinity
        ? t('pricing.base')
        : `≤ ${formatContext(minThinkingTierBound)}`;
    for (const column of Object.values(FAMILY_TO_COLUMN)) {
      const v = thinkingBase[column];
      if (v !== null) thinkingRows.set(label, column, v, -1);
    }
  }

  const sections: DetailSection[] = [];
  if (contextTiers.size > 0)
    sections.push({ title: t('pricing.contextPricing'), rows: contextTiers.rows() });
  if (thinkingRows.size > 0)
    sections.push({ title: t('pricing.thinkingMode'), rows: thinkingRows.rows() });
  if (modalityRows.size > 0)
    sections.push({ title: t('pricing.modalityRates'), rows: modalityRows.rows() });
  if (unitRows.size > 0) sections.push({ title: t('pricing.unitPricing'), rows: unitRows.rows() });

  // 主行摘要兜底：无通用输入价时回退到文本/嵌入价
  if (base.input === null) {
    const cells = cost ?? {};
    for (const fallbackKey of ['text_input', 'embedding_text']) {
      const v = cells[fallbackKey];
      if (typeof v === 'number') {
        base.input = v;
        break;
      }
    }
  }

  return {
    symbol,
    base,
    unit: summaryUnit ? `${formatMoney(symbol, summaryUnit.value)}${summaryUnit.suffix}` : null,
    tiered: contextTiers.size > 0,
    thinking: thinkingRows.size > 0,
    sections,
  };
}
