import { type Currency } from './currencies.js';
import type { BillingExprOptions, ModelCost } from './cost.js';
import { type ModelBillingExprResult } from './expr.js';
import type { PlaneRates } from './plane.js';
/** quota_display_type（TOKENS 在计费展示上等同 USD，故不单列） */
export type QuotaDisplayType = 'USD' | 'CNY' | 'CUSTOM';
export declare const QUOTA_DISPLAY_TYPES: readonly QuotaDisplayType[];
export interface NewApiDeployment {
    /** general_setting.quota_display_type */
    quotaDisplayType: QuotaDisplayType;
    /** USDExchangeRate：1 quota-USD 对应的人民币数量（显示为 CNY 时的显示汇率，亦作真实汇率兜底） */
    usdExchangeRate: number;
    /** general_setting.custom_currency_symbol */
    customCurrencySymbol: string;
    /** general_setting.custom_currency_exchange_rate：1 quota-USD 对应的自定义货币单位数 */
    customCurrencyExchangeRate: number;
    /** USDSettlementRate：1 真实美元值多少显示货币单位；0 = 未设置 */
    usdSettlementRate: number;
    /** 端点同时公布多份官方价目（currency_options）时，优先采用的价目货币 */
    preferredListCurrency: Currency;
}
/** new-api 出厂默认（USD2RMB / USDExchangeRate 均为 7.3） */
export declare const NEW_API_DEFAULTS: Readonly<NewApiDeployment>;
/**
 * 静态预设与 Web UI 未配置时共用的默认部署：出厂设置，但人民币汇率取自本仓库的
 * exchangeRates，使浏览器端默认生成的表达式与托管的 ratio_config 逐字一致。
 */
export declare function defaultDeployment(exchangeRates: Readonly<Record<string, number>>): NewApiDeployment;
/** 两份部署配置是否等价（用于判断用户是否偏离默认） */
export declare function sameDeployment(a: NewApiDeployment, b: NewApiDeployment): boolean;
/** 校验并补全外部（localStorage / new-api /api/status）读入的配置；非法字段回退 defaults */
export declare function sanitizeDeployment(value: unknown, defaults?: NewApiDeployment): NewApiDeployment;
/** 显示汇率 D：1 quota-USD 显示为多少显示货币单位 */
export declare function displayRate(deployment: NewApiDeployment): number;
/** 显示货币符号（与 new-api 前端一致） */
export declare function displaySymbol(deployment: NewApiDeployment): string;
/** 1 真实美元对应的 quota-USD 数量（new-api 前端 officialUsdToQuotaUsd 的倍数） */
export declare function quotaUsdPerRealUsd(deployment: NewApiDeployment): number;
/**
 * 各货币相对计费平面的汇率（每 1 quota-USD 对应的货币数量），供价目换算为系数。
 * CNY 由部署设置推导；其余非美元货币采用 fallbackFx（每 1 真实美元的货币数量，来自构建清单）。
 */
export declare function planeRates(deployment: NewApiDeployment, fallbackFx?: Readonly<Record<string, number>>): PlaneRates;
/** 按优先货币选取价目：存在该货币的官方价目时采用之（货币由键决定），否则用主价目 */
export declare function selectPriceSheet(cost: ModelCost | undefined, preferred: Currency): ModelCost | undefined;
/** 面向部署生成的结果：附带实际采用的价目货币 */
export interface DeploymentBillingExpr extends ModelBillingExprResult {
    sheetCurrency: Currency;
}
/** 按部署配置为单个模型生成 new-api 表达式 */
export declare function buildDeploymentBillingExpr(cost: ModelCost | undefined, options: BillingExprOptions, deployment: NewApiDeployment, fallbackFx?: Readonly<Record<string, number>>): DeploymentBillingExpr;
//# sourceMappingURL=deployment.d.ts.map