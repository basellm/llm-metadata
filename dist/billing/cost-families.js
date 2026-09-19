// 计费家族：与 models.dev Cost 字段一一对应（单位为 cost.currency / 1M tokens）。
// 运行时常量与类型定义分离，供货币换算与表达式生成共用。
export const COST_FAMILIES = [
    'input',
    'output',
    'reasoning',
    'cache_read',
    'cache_write',
    'input_audio',
    'output_audio',
];
//# sourceMappingURL=cost-families.js.map