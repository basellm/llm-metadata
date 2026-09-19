/** NewAPI / VoAPI 元数据派生工具 */
/** 将 token 数量格式化为 K/M 形式（如 128000 → "128K"） */
function formatTokensToKM(tokens) {
    if (!tokens || tokens <= 0)
        return null;
    const scale = (value, unit) => `${Number.isInteger(value) ? value : Number(value.toFixed(1))}${unit}`;
    if (tokens >= 1_000_000)
        return scale(tokens / 1_000_000, 'M');
    if (tokens >= 1_000)
        return scale(tokens / 1_000, 'K');
    return String(tokens);
}
/** 能力标志 → 标签键 */
const CAPABILITY_TAGS = [
    ['reasoning', 'reasoning'],
    ['tool_call', 'tools'],
    ['attachment', 'files'],
    ['open_weights', 'open_weights'],
];
/** 模态 → 标签键 */
const MODALITY_TAGS = [
    ['image', 'vision'],
    ['audio', 'audio'],
];
/** 归一化显式标签：去空白、去空项 */
export function explicitTags(model) {
    return (model.tags ?? []).map((tag) => String(tag).trim()).filter(Boolean);
}
/** 构建 NewAPI 模型标签：显式标签 + 能力 + 模态 + 生命周期状态 + 上下文窗口（经 map 本地化） */
export function buildModelTags(model, map) {
    const translate = (key) => map?.[key] ?? key;
    const tags = new Set(explicitTags(model).map(translate));
    for (const [capability, tag] of CAPABILITY_TAGS) {
        if (model[capability])
            tags.add(translate(tag));
    }
    const modalities = [...(model.modalities?.input ?? []), ...(model.modalities?.output ?? [])];
    for (const [modality, tag] of MODALITY_TAGS) {
        if (modalities.includes(modality))
            tags.add(translate(tag));
    }
    if (model.status)
        tags.add(translate(model.status));
    const context = formatTokensToKM(model.limit?.context);
    if (context)
        tags.add(translate(context));
    return [...tags];
}
/** 提取有效价格值 */
function extractValidPrice(value) {
    return typeof value === 'number' && value > 0 ? value : null;
}
/** 构建 VoAPI 模型价格信息 */
export function buildModelPriceInfo(cost) {
    return {
        input: extractValidPrice(cost?.input),
        output: extractValidPrice(cost?.output),
        cacheRead: extractValidPrice(cost?.cache_read),
        cacheWrite: extractValidPrice(cost?.cache_write),
    };
}
//# sourceMappingURL=format-utils.js.map