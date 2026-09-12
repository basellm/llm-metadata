/**
 * new-api 表达式计费（tiered_expr）生成器。
 *
 * 将 models.dev 形态的 USD 成本（基础价、reasoning 思考价、tiers 上下文阶梯、
 * 音频价）与仓库扩展（schedule 时段定价、per_image 按图价）转换为 new-api 的
 * billing_expr（expr-lang 语法）：
 * - 系数为 USD / 1M tokens 实价，与 new-api v1 表达式语义一致；
 * - 每个价格叶子以 tier("<name>", …) 包裹，供 new-api 记录命中档位；
 * - 显式 0 价保留为 `cr * 0` 等项：new-api 仅在表达式引用变量时才把对应 token
 *   从 p/c 中剔除，省略与 0 价并不等价；
 * - 分支自外向内：时段窗口（weekday/hour/minute 探针）→ 思考模式（param 探针）
 *   → 上下文阶梯（len，十进制阈值）；
 * - 时段条件采用 new-api 前端可结构化展示的形状：
 *   weekday(tz) >= a && weekday(tz) <= b && ((hour(tz) >= s && hour(tz) < e) || …)。
 */

import { COST_FAMILIES, type CostFamily } from '../constants/cost-families.js';
import type {
  CostFamilyCells,
  CostSchedule,
  CostScheduleWindow,
  ModelCost,
  ProviderBillingRule,
} from '../types/index.js';

/** 生成选项：供应商级计费规则中影响表达式的部分 */
export type BillingExprOptions = Pick<ProviderBillingRule, 'thinkingToggle' | 'cacheWrite1h'>;

/** 生成结果：expr 为 null 表示该模型无法以表达式计费（原因见 warnings） */
export interface BillingExprResult {
  expr: string | null;
  warnings: string[];
}

/** 价格段：lo 为生效起点 token 数（基础段 lo = 0） */
interface PriceSegment {
  lo: number;
  cells: CostFamilyCells;
}

const MINUTES_PER_DAY = 24 * 60;
const HOUR_RANGE_RE = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;

/** 系数按十进制原样输出（避免科学计数法） */
const COEFFICIENT_FORMAT = new Intl.NumberFormat('en-US', {
  useGrouping: false,
  maximumFractionDigits: 20,
});

function formatCoefficient(value: number): string {
  return COEFFICIENT_FORMAT.format(value);
}

/** 派生系数去除浮点噪声（保留 12 位有效数字） */
function scale(value: number, multiplier: number): number {
  return Number((value * multiplier).toPrecision(12));
}

/** token 阈值 → 档位名片段（32000 → "32k"，1000000 → "1m"） */
function formatSizeToken(tokens: number): string {
  if (tokens >= 1_000_000 && tokens % 1_000_000 === 0) return `${tokens / 1_000_000}m`;
  if (tokens % 1_000 === 0) return `${tokens / 1_000}k`;
  return String(tokens);
}

/** 仅保留有效（有限、非负）的计费家族价格 */
function pickCells(source: CostFamilyCells): CostFamilyCells {
  const cells: CostFamilyCells = {};
  for (const family of COST_FAMILIES) {
    const value = source[family];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) cells[family] = value;
  }
  return cells;
}

/** 基础段 + 结构化阶梯（tiers 优先，缺失时回退遗留 context_over_200k），按 lo 升序 */
function collectSegments(cost: ModelCost): PriceSegment[] {
  const byStart = new Map<number, CostFamilyCells>([[0, pickCells(cost)]]);
  const tiers = Array.isArray(cost.tiers) ? cost.tiers : [];
  const sized = tiers.filter((tier) => typeof tier.tier?.size === 'number' && tier.tier.size > 0);
  if (sized.length > 0) {
    for (const tier of sized) byStart.set(tier.tier!.size!, pickCells(tier));
  } else if (cost.context_over_200k) {
    byStart.set(200_000, pickCells(cost.context_over_200k));
  }
  return [...byStart].map(([lo, cells]) => ({ lo, cells })).sort((a, b) => a.lo - b.lo);
}

/** 家族在 start 处的生效价：lo ≤ start 且定义了该家族的最后一段（上层段继承下层未覆盖的家族） */
function cellAt(segments: PriceSegment[], family: CostFamily, start: number): number | undefined {
  let value: number | undefined;
  for (const segment of segments) {
    if (segment.lo > start) break;
    if (segment.cells[family] !== undefined) value = segment.cells[family];
  }
  return value;
}

/** 思考模式下的输出价：段内 reasoning 覆盖 output；后续段只给 output 时以其为准 */
function thinkingOutputAt(segments: PriceSegment[], start: number): number | undefined {
  let value: number | undefined;
  for (const segment of segments) {
    if (segment.lo > start) break;
    if (segment.cells.reasoning !== undefined) value = segment.cells.reasoning;
    else if (segment.cells.output !== undefined) value = segment.cells.output;
  }
  return value;
}

/** 叶子成本项（输入侧 → 输出侧）；家族缺失则不引用对应变量 */
function buildLeafTerms(
  segments: PriceSegment[],
  start: number,
  thinking: boolean,
  options: BillingExprOptions,
): string {
  const input = cellAt(segments, 'input', start)!;
  const terms = [`p * ${formatCoefficient(input)}`];

  const cacheRead = cellAt(segments, 'cache_read', start);
  if (cacheRead !== undefined) terms.push(`cr * ${formatCoefficient(cacheRead)}`);

  const cacheWrite = cellAt(segments, 'cache_write', start);
  if (cacheWrite !== undefined) {
    terms.push(`cc * ${formatCoefficient(cacheWrite)}`);
    if (options.cacheWrite1h !== undefined) {
      terms.push(`cc1h * ${formatCoefficient(scale(input, options.cacheWrite1h))}`);
    }
  }

  const audioIn = cellAt(segments, 'input_audio', start);
  if (audioIn !== undefined) terms.push(`ai * ${formatCoefficient(audioIn)}`);

  const output = thinking ? thinkingOutputAt(segments, start) : cellAt(segments, 'output', start);
  if (output !== undefined) terms.push(`c * ${formatCoefficient(output)}`);

  const audioOut = cellAt(segments, 'output_audio', start);
  if (audioOut !== undefined) terms.push(`ao * ${formatCoefficient(audioOut)}`);

  return terms.join(' + ');
}

/** 非叶子分支作为三元分支时加括号 */
function wrapBranch(expr: string): string {
  return expr.startsWith('tier(') ? expr : `(${expr})`;
}

/** 上下文阶梯链：无阈值为单叶子，有阈值为 len 三元链 */
function buildTierChain(
  segments: PriceSegment[],
  nameParts: string[],
  thinking: boolean,
  options: BillingExprOptions,
): string {
  const thresholds = segments.map((segment) => segment.lo).filter((lo) => lo > 0);
  const starts = [0, ...thresholds];

  const leaves = starts.map((start, index) => {
    const range =
      thresholds.length === 0
        ? null
        : index === 0
          ? `0_${formatSizeToken(thresholds[0])}`
          : index < thresholds.length
            ? `${formatSizeToken(start)}_${formatSizeToken(thresholds[index])}`
            : `${formatSizeToken(start)}_plus`;
    const name = [...nameParts, ...(range ? [range] : [])].join('_') || 'standard';
    return `tier(${JSON.stringify(name)}, ${buildLeafTerms(segments, start, thinking, options)})`;
  });

  return (
    thresholds.map((threshold, index) => `len <= ${threshold} ? ${leaves[index]} : `).join('') +
    leaves[leaves.length - 1]
  );
}

/** 标准 / 思考模式分支：仅当某段 reasoning 价与 output 价不同且供应商定义了开关时才分叉 */
function buildModeBranch(
  segments: PriceSegment[],
  nameParts: string[],
  options: BillingExprOptions,
  warnings: string[],
): string {
  const standard = buildTierChain(segments, nameParts, false, options);

  const divergentStart = segments
    .map((segment) => segment.lo)
    .find((start) => thinkingOutputAt(segments, start) !== cellAt(segments, 'output', start));
  if (divergentStart === undefined) return standard;

  if (!options.thinkingToggle) {
    const describe = (value: number | undefined) =>
      value === undefined ? 'unset' : `$${formatCoefficient(value)}`;
    warnings.push(
      `reasoning price ${describe(thinkingOutputAt(segments, divergentStart))} differs from output price ` +
        `${describe(cellAt(segments, 'output', divergentStart))} but the provider defines no thinkingToggle; ` +
        'output price applies to all completion tokens',
    );
    return standard;
  }

  const { param, value } = options.thinkingToggle;
  const thinking = buildTierChain(segments, [...nameParts, 'thinking'], true, options);
  return `param(${JSON.stringify(param)}) == ${JSON.stringify(value)} ? ${wrapBranch(thinking)} : ${wrapBranch(standard)}`;
}

// === 时段定价 ===

/** "HH:MM" → 自午夜起的分钟数；"24:00" 允许作为结束时刻 */
function parseHourRange(text: string): [number, number] {
  const match = HOUR_RANGE_RE.exec(text);
  if (!match) throw new Error(`hours entry "${text}" must match "HH:MM-HH:MM"`);
  const [startHour, startMinute, endHour, endMinute] = match.slice(1).map(Number);
  const valid = (hour: number, minute: number, isEnd: boolean) =>
    minute < 60 && (hour < 24 || (isEnd && hour === 24 && minute === 0));
  if (!valid(startHour, startMinute, false) || !valid(endHour, endMinute, true)) {
    throw new Error(`hours entry "${text}" is out of range`);
  }
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  if (start === end) throw new Error(`hours entry "${text}" is empty`);
  if (start === 0 && end === MINUTES_PER_DAY) {
    throw new Error(`hours entry "${text}" covers the whole day; omit hours instead`);
  }
  return [start, end];
}

function isValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** 校验时段配置；不合法时抛出说明原因的错误 */
function validateSchedule(schedule: CostSchedule, base: ModelCost): void {
  if (typeof schedule.timezone !== 'string' || !isValidTimeZone(schedule.timezone)) {
    throw new Error(`timezone "${String(schedule.timezone)}" is not a valid IANA zone`);
  }
  if (typeof schedule.fallback !== 'string' || !schedule.fallback) {
    throw new Error('fallback tier name is required');
  }
  if (!Array.isArray(schedule.windows) || schedule.windows.length === 0) {
    throw new Error('at least one window is required');
  }

  const tiered = collectSegments(base).length > 1;
  const names = new Set<string>([schedule.fallback]);
  for (const window of schedule.windows) {
    if (typeof window.name !== 'string' || !window.name) throw new Error('window name is required');
    if (names.has(window.name)) throw new Error(`duplicate tier name "${window.name}"`);
    names.add(window.name);

    if (window.weekdays === undefined && window.hours === undefined) {
      throw new Error(`window "${window.name}" needs weekdays and/or hours`);
    }
    if (window.weekdays !== undefined) {
      const days = new Set(Array.isArray(window.weekdays) ? window.weekdays : []);
      if (
        days.size === 0 ||
        [...days].some((day) => !Number.isInteger(day) || day < 0 || day > 6)
      ) {
        throw new Error(`window "${window.name}" weekdays must be integers 0 (Sunday) to 6`);
      }
      if (days.size === 7) {
        throw new Error(`window "${window.name}" weekdays cover every day; omit weekdays instead`);
      }
    }
    if (window.hours !== undefined) {
      if (!Array.isArray(window.hours) || window.hours.length === 0) {
        throw new Error(`window "${window.name}" hours must be a non-empty array`);
      }
      window.hours.forEach(parseHourRange);
    }

    if (Object.keys(pickCells(window)).length === 0) {
      throw new Error(`window "${window.name}" overrides no price`);
    }
    if (tiered && !Array.isArray(window.tiers)) {
      throw new Error(`window "${window.name}" must define its own tiers on a tiered model`);
    }
  }
}

/** 星期条件：连续区间合并为 >= / <=，单日为 ==，多区间以 || 连接 */
function weekdayCondition(zone: string, weekdays: number[]): string {
  const runs: [number, number][] = [];
  for (const day of [...new Set(weekdays)].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && last[1] === day - 1) last[1] = day;
    else runs.push([day, day]);
  }
  const parts = runs.map(([from, to]) =>
    from === to
      ? `weekday(${zone}) == ${from}`
      : `weekday(${zone}) >= ${from} && weekday(${zone}) <= ${to}`,
  );
  if (parts.length === 1) return parts[0];
  return `(${parts.map((part) => (part.includes(' && ') ? `(${part})` : part)).join(' || ')})`;
}

/** 单个时间区间条件：整点区间用 hour()，含分钟用分钟数；跨午夜以 || 表达 */
function hourRangeCondition(zone: string, start: number, end: number): string {
  const wholeHours = start % 60 === 0 && end % 60 === 0;
  const probe = wholeHours ? `hour(${zone})` : `hour(${zone}) * 60 + minute(${zone})`;
  const unit = wholeHours ? 60 : 1;
  const from = start / unit;
  const to = end / unit;
  if (start > end) return `(${probe} >= ${from} || ${probe} < ${to})`;

  const bounds: string[] = [];
  if (start > 0) bounds.push(`${probe} >= ${from}`);
  if (end < MINUTES_PER_DAY) bounds.push(`${probe} < ${to}`);
  return bounds.join(' && ');
}

/** 窗口条件：星期 && 时间区间组 */
function windowCondition(window: CostScheduleWindow, timezone: string): string {
  const zone = JSON.stringify(timezone);
  const parts: string[] = [];
  if (window.weekdays) parts.push(weekdayCondition(zone, window.weekdays));
  if (window.hours) {
    const ranges = window.hours.map((text) => hourRangeCondition(zone, ...parseHourRange(text)));
    parts.push(
      ranges.length === 1
        ? ranges[0]
        : `(${ranges.map((range) => (range.includes(' && ') ? `(${range})` : range)).join(' || ')})`,
    );
  }
  return parts.join(' && ');
}

/** 窗口内成本：基础成本浅合并窗口价格（窗口自带 tiers 时替换基础阶梯） */
function windowCost(base: ModelCost, window: CostScheduleWindow): ModelCost {
  return { ...base, ...pickCells(window), ...(window.tiers ? { tiers: window.tiers } : {}) };
}

/**
 * 从 USD 成本生成 new-api 计费表达式。
 * 无 token 输入价时回退按图价（tier("image", fixed(USD)) * image_count）；
 * 均缺失或时段配置不合法时返回 null 并给出原因。
 */
export function buildBillingExpr(cost: ModelCost, options: BillingExprOptions): BillingExprResult {
  const warnings: string[] = [];
  const perImage = typeof cost.per_image === 'number' && cost.per_image >= 0;

  if (typeof cost.input !== 'number' || cost.input < 0) {
    if (perImage) {
      return {
        expr: `tier("image", fixed(${formatCoefficient(cost.per_image!)})) * image_count`,
        warnings,
      };
    }
    if (Object.values(cost).some((value) => typeof value === 'number')) {
      warnings.push('no token input price or per_image price; not expressible');
    }
    return { expr: null, warnings };
  }
  if (perImage) warnings.push('per_image ignored in favour of token pricing');

  const { schedule, ...base } = cost;
  if (schedule === undefined) {
    return { expr: buildModeBranch(collectSegments(base), [], options, warnings), warnings };
  }

  try {
    validateSchedule(schedule, base);
  } catch (error) {
    warnings.push(`invalid schedule: ${(error as Error).message}`);
    return { expr: null, warnings };
  }

  const branches = schedule.windows.map((window) => {
    const branch = buildModeBranch(
      collectSegments(windowCost(base, window)),
      [window.name],
      options,
      warnings,
    );
    return `${windowCondition(window, schedule.timezone)} ? ${wrapBranch(branch)} : `;
  });
  const fallback = buildModeBranch(collectSegments(base), [schedule.fallback], options, warnings);
  return { expr: branches.join('') + wrapBranch(fallback), warnings };
}
