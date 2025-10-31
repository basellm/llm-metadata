/** 格式化工具函数 */
/** 将 token 数量格式化为 K/M 形式 */
export function formatTokensToKM(tokens) {
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
export function escapeMarkdownPipes(text) {
    return (text || '').replace(/\|/g, '\\|');
}
/** 获取货币符号 */
function getCurrencySymbol(currency) {
    const symbols = { CNY: '¥', EUR: '€', USD: '$' };
    return symbols[currency || 'USD'];
}
/** 格式化字段名称（将 snake_case 转为 Title Case） */
function formatFieldName(field) {
    return field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
/** 格式化价格值 */
function formatPrice(symbol, value, suffix = '') {
    return `${symbol}${value}${suffix}`;
}
/** 从对象中提取所有数字类型的字段 */
function extractNumericFields(obj) {
    return Object.entries(obj)
        .filter(([, value]) => typeof value === 'number')
        .map(([key, value]) => [key, value]);
}
/** 定价字段配置（按优先级排序） */
const PRICING_FIELD_CONFIGS = [
    // 1. 基础 input/output 字段
    {
        keys: ['input'],
        priority: 1,
        formatter: (cost, symbol) => {
            const output = cost.output !== undefined ? formatPrice(symbol, cost.output) : '-';
            return [`In: ${formatPrice(symbol, cost.input)}<br/>Out: ${output}`];
        },
    },
    // 2. 多模态字段
    {
        keys: ['text_input', 'vision_input', 'audio_input'],
        priority: 2,
        formatter: (cost, symbol) => {
            const lines = [];
            const inputs = [
                ['Text In', 'text_input', ''],
                ['Vision In', 'vision_input', ''],
                ['Audio In', 'audio_input', ''],
            ];
            inputs.forEach(([label, key]) => {
                if (cost[key] !== undefined)
                    lines.push(`${label}: ${formatPrice(symbol, cost[key])}`);
            });
            // 多模态输出
            const outputs = [
                ['Out', 'multi_output'],
                ['Multi Out', 'multiin_text_output'],
                ['Pure Out', 'purein_text_output'],
            ];
            for (const [label, key] of outputs) {
                if (cost[key] !== undefined) {
                    lines.push(`${label}: ${formatPrice(symbol, cost[key])}`);
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
            const fields = [
                ['Text', 'embedding_text'],
                ['Image', 'embedding_image'],
            ];
            return fields
                .filter(([, key]) => cost[key] !== undefined)
                .map(([label, key]) => `${label}: ${formatPrice(symbol, cost[key], '/1K')}`);
        },
    },
    // 4. 按单位计费
    {
        keys: ['per_second', 'per_10k_chars', 'per_image'],
        priority: 4,
        formatter: (cost, symbol) => {
            const units = [
                ['per_second', '/s'],
                ['per_10k_chars', '/10K chars'],
                ['per_image', '/img'],
            ];
            for (const [key, unit] of units) {
                if (cost[key] !== undefined) {
                    return [formatPrice(symbol, cost[key], unit)];
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
            const fields = [
                ['Text', 'text', ''],
                ['VL', 'vl', '/1K'],
            ];
            return fields
                .filter(([, key]) => cost[key] !== undefined)
                .map(([label, key, suffix]) => `${label}: ${formatPrice(symbol, cost[key], suffix)}`);
        },
    },
];
/** 所有已知的显式字段（从配置自动生成） */
const KNOWN_FIELDS = (() => {
    const fields = new Set();
    PRICING_FIELD_CONFIGS.forEach((config) => {
        config.keys.forEach((key) => fields.add(key));
    });
    return fields;
})();
/** 格式化定价信息 */
export function formatPricing(cost) {
    if (!cost)
        return '-';
    const symbol = getCurrencySymbol(cost.currency);
    const lines = [];
    // 按优先级匹配字段配置
    for (const config of PRICING_FIELD_CONFIGS) {
        const hasAnyKey = config.keys.some((key) => cost[key] !== undefined);
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
/** 能力标志映射 */
const CAPABILITY_EMOJIS = [
    ['attachment', '📎'],
    ['reasoning', '🧠'],
    ['tool_call', '🔧'],
    ['temperature', '🌡️'],
];
/** 格式化能力标志 */
export function formatCapabilities(model) {
    const emojis = CAPABILITY_EMOJIS.filter(([key]) => model[key]).map(([, emoji]) => emoji);
    return emojis.length > 0 ? emojis.join(' ') : '-';
}
/** 格式化模态信息 */
export function formatModalities(modalities) {
    const formatMods = (mods) => mods?.join(', ') || 'text';
    return `In: ${formatMods(modalities?.input)}<br/>Out: ${formatMods(modalities?.output)}`;
}
/** 格式化额外详情 */
export function formatDetails(model) {
    const details = [];
    if (model.open_weights)
        details.push('Open Weights');
    if (model.release_date)
        details.push(`Released: ${model.release_date}`);
    if (model.last_updated && model.last_updated !== model.release_date) {
        details.push(`Updated: ${model.last_updated}`);
    }
    return details.length > 0 ? details.join('<br/>') : '-';
}
/** 格式化限制信息 */
export function formatLimit(value) {
    return formatTokensToKM(value) || '-';
}
/** 能力到标签的映射 */
const CAPABILITY_TAG_MAPPINGS = [
    ['reasoning', 'reasoning'],
    ['tool_call', 'tools'],
    ['attachment', 'files'],
    ['open_weights', 'open_weights'],
];
/** 模态到标签的映射 */
const MODALITY_TAG_MAPPINGS = [
    ['image', 'vision'],
    ['audio', 'audio'],
];
/** 构建模型标签字符串 */
export function buildModelTags(model, map) {
    const tagSet = new Set();
    const translate = (key) => map?.[key] ?? key;
    // 处理显式标签
    const tags = Array.isArray(model.tags)
        ? model.tags
        : typeof model.tags === 'string'
            ? model.tags.split(/[;,\s]+/g)
            : [];
    tags.forEach((tag) => {
        const trimmed = String(tag).trim();
        if (trimmed)
            tagSet.add(translate(trimmed));
    });
    // 基于能力添加标签
    CAPABILITY_TAG_MAPPINGS.forEach(([capability, tag]) => {
        if (model[capability])
            tagSet.add(translate(tag));
    });
    // 基于模态添加标签
    const allMods = [...(model.modalities?.input || []), ...(model.modalities?.output || [])];
    MODALITY_TAG_MAPPINGS.forEach(([modality, tag]) => {
        if (allMods.includes(modality))
            tagSet.add(translate(tag));
    });
    // 添加上下文窗口标签
    const contextTag = formatTokensToKM(model.limit?.context);
    if (contextTag)
        tagSet.add(translate(contextTag));
    return Array.from(tagSet);
}
/** 提取有效价格值（辅助函数） */
function extractValidPrice(value) {
    return typeof value === 'number' && value > 0 ? value : null;
}
/** 构建模型价格信息 */
export function buildModelPriceInfo(cost) {
    return {
        input: extractValidPrice(cost?.input),
        output: extractValidPrice(cost?.output),
        cacheRead: extractValidPrice(cost?.cache_read),
        cacheWrite: extractValidPrice(cost?.cache_write),
    };
}
//# sourceMappingURL=format-utils.js.map