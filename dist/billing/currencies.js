// 结算货币：cost.currency / 供应商 currency / currency_options 键共用的封闭集合。
// 新增货币时同步在 data/native-providers.json 的 exchangeRates 中提供汇率。
export const CURRENCIES = ['USD', 'CNY', 'EUR'];
export function isCurrency(value) {
    return typeof value === 'string' && CURRENCIES.includes(value);
}
//# sourceMappingURL=currencies.js.map