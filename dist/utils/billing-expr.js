/**
 * new-api 表达式计费（tiered_expr）生成器。
 *
 * 将带分层定价（扁平键 input_32k_128k、结构化 tiers 数组、遗留
 * context_over_200k）或思考模式差价（thinking_*）的 USD 成本转换为
 * new-api 的 billing_expr 表达式（expr-lang 语法）：
 * - 系数单位为 USD / 1M tokens，与 new-api v1 表达式语义一致；
 * - 档位条件使用 len（完整输入上下文长度），阈值采用十进制
 *   （32k = 32000，1m = 1000000），与 new-api 前端预设一致；
 * - 每个档位叶子用 tier("<name>", ...) 包裹以便命中记录；
 * - 思考模式用 param("enable_thinking") 判定（阿里 DashScope /
 *   OpenAI 兼容端点的官方开关参数）。
 */
/** 计费家族到 new-api 表达式变量的映射 */
const FAMILY_VARS = [
    ['input', 'p'],
    ['output', 'c'],
    ['cache_read', 'cr'],
    ['cache_write', 'cc'],
];
/** 解析 "32k" / "1m" 形式的档位边界为 token 数（十进制） */
function parseSizeToken(size) {
    const match = /^(\d+(?:\.\d+)?)(k|m)$/.exec(size);
    if (!match)
        return null;
    const value = Number(match[1]);
    return match[2] === 'k' ? value * 1_000 : value * 1_000_000;
}
/** 将 token 数格式化回 "32k" / "1m" 形式（用于档位命名） */
function formatSizeToken(tokens) {
    if (tokens >= 1_000_000 && tokens % 1_000_000 === 0)
        return `${tokens / 1_000_000}m`;
    if (tokens % 1_000 === 0)
        return `${tokens / 1_000}k`;
    return String(tokens);
}
/**
 * 收集某前缀（'' 或 'thinking_'）下各家族的价格档位，按 lo 升序。
 * 标准分支额外摄入结构化阶梯：tiers 数组（阈值以上生效）优先，
 * 缺失时回退遗留 context_over_200k；同阈值时结构化值覆盖扁平键。
 */
function collectSegments(cost, prefix) {
    const byFamily = new Map();
    const put = (family, lo, price) => {
        let entries = byFamily.get(family);
        if (!entries) {
            entries = new Map();
            byFamily.set(family, entries);
        }
        entries.set(lo, price);
    };
    for (const [family] of FAMILY_VARS) {
        const base = cost[`${prefix}${family}`];
        if (typeof base === 'number' && base >= 0) {
            put(family, 0, base);
        }
        const tierKeyRe = new RegExp(`^${prefix}${family}_(\\d+(?:\\.\\d+)?[km])_(\\d+(?:\\.\\d+)?[km])$`);
        for (const [key, value] of Object.entries(cost)) {
            const match = tierKeyRe.exec(key);
            if (!match || typeof value !== 'number')
                continue;
            const lo = parseSizeToken(match[1]);
            if (lo === null)
                continue;
            put(family, lo, value);
        }
    }
    if (prefix === '') {
        const structured = [];
        if (Array.isArray(cost.tiers)) {
            for (const entry of cost.tiers) {
                const size = entry?.tier?.size;
                if (typeof size === 'number' && size > 0) {
                    structured.push({ threshold: size, cells: entry });
                }
            }
        }
        if (structured.length === 0 && cost.context_over_200k) {
            structured.push({ threshold: 200_000, cells: cost.context_over_200k });
        }
        for (const { threshold, cells } of structured) {
            for (const [family] of FAMILY_VARS) {
                const price = cells[family];
                if (typeof price === 'number' && price >= 0) {
                    put(family, threshold, price);
                }
            }
        }
    }
    const segments = new Map();
    for (const [family, entries] of byFamily) {
        segments.set(family, [...entries.entries()].map(([lo, price]) => ({ lo, price })).sort((a, b) => a.lo - b.lo));
    }
    return segments;
}
/** 取家族在指定档位起点处生效的价格（lo ≤ start 的最后一档） */
function priceAt(segments, start) {
    if (!segments)
        return null;
    let price = null;
    for (const segment of segments) {
        if (segment.lo <= start)
            price = segment.price;
        else
            break;
    }
    return price;
}
/** 生成单个档位叶子的成本项（p * X + c * Y + ...） */
function buildLeafTerms(segments, start, audioTerms) {
    const terms = [];
    for (const [family, variable] of FAMILY_VARS) {
        const price = priceAt(segments.get(family), start);
        if (price !== null && price > 0) {
            terms.push(`${variable} * ${price}`);
        }
    }
    terms.push(...audioTerms);
    return terms.length > 0 ? terms.join(' + ') : null;
}
/**
 * 生成一个分支（标准或思考模式）的档位链表达式。
 * 无档位阈值时返回单叶子；有阈值时返回 len 三元链。
 */
function buildBranch(segments, audioTerms, namePrefix) {
    const thresholds = [...new Set([...segments.values()].flatMap((list) => list.map((s) => s.lo)))]
        .filter((lo) => lo > 0)
        .sort((a, b) => a - b);
    if (thresholds.length === 0) {
        const terms = buildLeafTerms(segments, 0, audioTerms);
        if (terms === null)
            return null;
        return `tier("${namePrefix}standard", ${terms})`;
    }
    const starts = [0, ...thresholds];
    const leaves = [];
    for (let i = 0; i < starts.length; i++) {
        const name = i === 0
            ? `${namePrefix}0_${formatSizeToken(thresholds[0])}`
            : i < thresholds.length
                ? `${namePrefix}${formatSizeToken(starts[i])}_${formatSizeToken(thresholds[i])}`
                : `${namePrefix}${formatSizeToken(starts[i])}_plus`;
        const terms = buildLeafTerms(segments, starts[i], audioTerms);
        if (terms === null)
            return null;
        leaves.push(`tier("${name}", ${terms})`);
    }
    const parts = [];
    for (let i = 0; i < thresholds.length; i++) {
        parts.push(`len <= ${thresholds[i]} ? ${leaves[i]} : `);
    }
    return parts.join('') + leaves[leaves.length - 1];
}
/**
 * 从 USD 成本生成 new-api tiered_expr 计费表达式。
 * 仅当模型具有分层定价或思考模式差价时返回表达式，否则返回 null
 * （常规单价模型继续使用 model_ratio 体系）。
 */
export function buildTieredBillingExpr(cost) {
    if (!cost)
        return null;
    const standard = collectSegments(cost, '');
    const thinking = collectSegments(cost, 'thinking_');
    const hasTiers = [...standard.values()].some((list) => list.some((s) => s.lo > 0));
    const hasThinking = thinking.has('input') || thinking.has('output');
    if (!hasTiers && !hasThinking)
        return null;
    // 基础输入价缺失时无法构造可靠表达式（如特殊多模态模型），回退倍率体系
    if (priceAt(standard.get('input'), 0) === null)
        return null;
    // 音频 token 单价不分档，作为附加项加入每个叶子
    const audioTerms = [];
    const audioIn = cost['input_audio'];
    if (typeof audioIn === 'number' && audioIn > 0)
        audioTerms.push(`ai * ${audioIn}`);
    const audioOut = cost['output_audio'];
    if (typeof audioOut === 'number' && audioOut > 0)
        audioTerms.push(`ao * ${audioOut}`);
    const standardBranch = buildBranch(standard, audioTerms, '');
    if (standardBranch === null)
        return null;
    if (!hasThinking)
        return standardBranch;
    // 思考分支：缺失的家族回退到标准价（如思考模式缓存价与标准一致时上游只标注一份）
    const merged = new Map(thinking);
    for (const [family] of FAMILY_VARS) {
        if (!merged.has(family) && standard.has(family)) {
            merged.set(family, standard.get(family));
        }
    }
    const thinkingBranch = buildBranch(merged, audioTerms, 'thinking_');
    if (thinkingBranch === null)
        return standardBranch;
    return `param("enable_thinking") == true ? (${thinkingBranch}) : (${standardBranch})`;
}
//# sourceMappingURL=billing-expr.js.map