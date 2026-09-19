// new-api 部署配置：把「定价与显示」设置映射为表达式系数的换算规则。
//
// new-api 的表达式系数以其 quota-USD 平面计价（quota = 系数 / 1e6 × QuotaPerUnit × 分组倍率），
// 汇率与货币显示只影响展示，绝不参与结算；因此要让 new-api 展示出官方价，
// 系数必须按部署的显示汇率（USDExchangeRate）与美元结算汇率（USDSettlementRate）预先换算：
//   D = 显示汇率（1 quota-USD 显示为多少显示货币单位；USD 显示为 1）
//   S = 美元结算汇率（1 真实美元值多少显示货币单位；0 表示未设置，真实美元即 quota-USD）
//   1 真实美元 = (S > 0 ? S / D : 1) quota-USD            —— 对应前端 officialUsdToQuotaUsd
//   1 人民币   = 1 / FX 真实美元，FX = 显示为 CNY 且 S > 0 ? S : USDExchangeRate

import { isCurrency, type Currency } from './currencies.js';
import type { BillingExprOptions, ModelCost } from './cost.js';
import { buildModelBillingExpr, type ModelBillingExprResult } from './expr.js';
import type { PlaneRates } from './plane.js';

/** quota_display_type（TOKENS 在计费展示上等同 USD，故不单列） */
export type QuotaDisplayType = 'USD' | 'CNY' | 'CUSTOM';

export const QUOTA_DISPLAY_TYPES: readonly QuotaDisplayType[] = ['USD', 'CNY', 'CUSTOM'];

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
export const NEW_API_DEFAULTS: Readonly<NewApiDeployment> = {
  quotaDisplayType: 'USD',
  usdExchangeRate: 7.3,
  customCurrencySymbol: '¤',
  customCurrencyExchangeRate: 1,
  usdSettlementRate: 0,
  preferredListCurrency: 'USD',
};

/**
 * 静态预设与 Web UI 未配置时共用的默认部署：出厂设置，但人民币汇率取自本仓库的
 * exchangeRates，使浏览器端默认生成的表达式与托管的 ratio_config 逐字一致。
 */
export function defaultDeployment(
  exchangeRates: Readonly<Record<string, number>>,
): NewApiDeployment {
  const cny = exchangeRates.CNY;
  return {
    ...NEW_API_DEFAULTS,
    usdExchangeRate:
      typeof cny === 'number' && Number.isFinite(cny) && cny > 0
        ? cny
        : NEW_API_DEFAULTS.usdExchangeRate,
  };
}

/** 两份部署配置是否等价（用于判断用户是否偏离默认） */
export function sameDeployment(a: NewApiDeployment, b: NewApiDeployment): boolean {
  return (
    a.quotaDisplayType === b.quotaDisplayType &&
    a.usdExchangeRate === b.usdExchangeRate &&
    a.customCurrencySymbol === b.customCurrencySymbol &&
    a.customCurrencyExchangeRate === b.customCurrencyExchangeRate &&
    a.usdSettlementRate === b.usdSettlementRate &&
    a.preferredListCurrency === b.preferredListCurrency
  );
}

const MAX_SYMBOL_LENGTH = 8;

function positive(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

/** 校验并补全外部（localStorage / new-api /api/status）读入的配置；非法字段回退 defaults */
export function sanitizeDeployment(
  value: unknown,
  defaults: NewApiDeployment = NEW_API_DEFAULTS,
): NewApiDeployment {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const symbol =
    typeof raw.customCurrencySymbol === 'string' ? raw.customCurrencySymbol.trim() : '';
  const settlement = raw.usdSettlementRate;
  return {
    quotaDisplayType: (QUOTA_DISPLAY_TYPES as readonly unknown[]).includes(raw.quotaDisplayType)
      ? (raw.quotaDisplayType as QuotaDisplayType)
      : defaults.quotaDisplayType,
    usdExchangeRate: positive(raw.usdExchangeRate, defaults.usdExchangeRate),
    customCurrencySymbol: symbol
      ? symbol.slice(0, MAX_SYMBOL_LENGTH)
      : defaults.customCurrencySymbol,
    customCurrencyExchangeRate: positive(
      raw.customCurrencyExchangeRate,
      defaults.customCurrencyExchangeRate,
    ),
    usdSettlementRate:
      typeof settlement === 'number' && Number.isFinite(settlement) && settlement >= 0
        ? settlement
        : defaults.usdSettlementRate,
    preferredListCurrency: isCurrency(raw.preferredListCurrency)
      ? raw.preferredListCurrency
      : defaults.preferredListCurrency,
  };
}

/** 显示汇率 D：1 quota-USD 显示为多少显示货币单位 */
export function displayRate(deployment: NewApiDeployment): number {
  switch (deployment.quotaDisplayType) {
    case 'CNY':
      return deployment.usdExchangeRate;
    case 'CUSTOM':
      return deployment.customCurrencyExchangeRate;
    default:
      return 1;
  }
}

/** 显示货币符号（与 new-api 前端一致） */
export function displaySymbol(deployment: NewApiDeployment): string {
  switch (deployment.quotaDisplayType) {
    case 'CNY':
      return '¥';
    case 'CUSTOM':
      return deployment.customCurrencySymbol;
    default:
      return '$';
  }
}

/** 1 真实美元对应的 quota-USD 数量（new-api 前端 officialUsdToQuotaUsd 的倍数） */
export function quotaUsdPerRealUsd(deployment: NewApiDeployment): number {
  return deployment.usdSettlementRate > 0
    ? deployment.usdSettlementRate / displayRate(deployment)
    : 1;
}

/** 真实人民币汇率（每 1 真实美元的人民币数量） */
function realCnyPerUsd(deployment: NewApiDeployment): number {
  return deployment.quotaDisplayType === 'CNY' && deployment.usdSettlementRate > 0
    ? deployment.usdSettlementRate
    : deployment.usdExchangeRate;
}

/**
 * 各货币相对计费平面的汇率（每 1 quota-USD 对应的货币数量），供价目换算为系数。
 * CNY 由部署设置推导；其余非美元货币采用 fallbackFx（每 1 真实美元的货币数量，来自构建清单）。
 */
export function planeRates(
  deployment: NewApiDeployment,
  fallbackFx: Readonly<Record<string, number>> = {},
): PlaneRates {
  const perRealUsd = quotaUsdPerRealUsd(deployment);
  const unitsPerQuotaUsd = (unitsPerRealUsd: number) => unitsPerRealUsd / perRealUsd;
  const rates: Record<string, number> = {};
  for (const [code, fx] of Object.entries(fallbackFx)) {
    if (Number.isFinite(fx) && fx > 0) rates[code] = unitsPerQuotaUsd(fx);
  }
  rates.USD = unitsPerQuotaUsd(1);
  rates.CNY = unitsPerQuotaUsd(realCnyPerUsd(deployment));
  return rates;
}

/** 按优先货币选取价目：存在该货币的官方价目时采用之（货币由键决定），否则用主价目 */
export function selectPriceSheet(
  cost: ModelCost | undefined,
  preferred: Currency,
): ModelCost | undefined {
  if (!cost) return undefined;
  const option =
    preferred !== (cost.currency ?? 'USD') ? cost.currency_options?.[preferred] : undefined;
  return option ? { ...option, currency: preferred } : cost;
}

/** 面向部署生成的结果：附带实际采用的价目货币 */
export interface DeploymentBillingExpr extends ModelBillingExprResult {
  sheetCurrency: Currency;
}

/** 按部署配置为单个模型生成 new-api 表达式 */
export function buildDeploymentBillingExpr(
  cost: ModelCost | undefined,
  options: BillingExprOptions,
  deployment: NewApiDeployment,
  fallbackFx?: Readonly<Record<string, number>>,
): DeploymentBillingExpr {
  const sheet = selectPriceSheet(cost, deployment.preferredListCurrency);
  return {
    ...buildModelBillingExpr(sheet, options, planeRates(deployment, fallbackFx)),
    sheetCurrency: sheet?.currency ?? 'USD',
  };
}
