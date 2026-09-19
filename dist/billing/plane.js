// 把任意货币的价目换算到 new-api 的计费平面（表达式系数所在的 "quota-USD" 单位）。
import { COST_FAMILIES } from './cost-families.js';
/**
 * 将价目换算到计费平面：顶层数字字段与嵌套结构（tiers / context_over_200k /
 * schedule 窗口及其 tiers）中的计费家族价格一并换算（保留 6 位有效数字）；
 * tier.size、weekdays 等非价格字段保持原样。其他货币的官方价目（currency_options）
 * 不参与换算，结果中丢弃。汇率为 1 时原样返回（不做任何舍入）。
 * rates 缺少 USD 时视为 1（真实美元即平面单位）。
 */
export function normalizeCostToPlane(cost, rates) {
    if (!cost)
        return {};
    const currency = cost.currency || 'USD';
    const rate = rates[currency] ?? (currency === 'USD' ? 1 : undefined);
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
        return { unknownCurrency: currency };
    }
    if (rate === 1)
        return { cost };
    const convert = (value) => Number((value / rate).toPrecision(6));
    const convertCells = (cells) => {
        const out = { ...cells };
        for (const family of COST_FAMILIES) {
            const value = out[family];
            if (typeof value === 'number')
                out[family] = convert(value);
        }
        return out;
    };
    const convertTiers = (tiers) => tiers.map(convertCells);
    const converted = { currency: 'USD' };
    for (const [key, value] of Object.entries(cost)) {
        if (key === 'currency' || key === 'currency_options')
            continue;
        if (typeof value === 'number') {
            converted[key] = convert(value);
        }
        else if (key === 'tiers' && Array.isArray(value)) {
            converted.tiers = convertTiers(value);
        }
        else if (key === 'context_over_200k' && value && typeof value === 'object') {
            converted.context_over_200k = convertCells(value);
        }
        else if (key === 'schedule' && value && typeof value === 'object') {
            const schedule = value;
            converted.schedule = {
                ...schedule,
                windows: (Array.isArray(schedule.windows) ? schedule.windows : []).map((window) => ({
                    ...convertCells(window),
                    ...(Array.isArray(window.tiers) ? { tiers: convertTiers(window.tiers) } : {}),
                })),
            };
        }
        else {
            converted[key] = value;
        }
    }
    return { cost: converted };
}
//# sourceMappingURL=plane.js.map