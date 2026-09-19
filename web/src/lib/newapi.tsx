/**
 * new-api 部署配置：持久化、上下文，以及据此即时生成计费表达式的派生函数。
 * 生成逻辑本身来自与构建脚本共用的 src/billing，默认部署下产出与托管的 ratio_config 逐字一致。
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Currency } from '@billing/currencies';
import {
  buildDeploymentBillingExpr,
  defaultDeployment,
  displayRate,
  displaySymbol,
  sameDeployment,
  sanitizeDeployment,
  type NewApiDeployment,
} from '@billing/deployment';
import {
  buildRatioConfig,
  type NewApiPriceConfig,
  type RatioConfigProvider,
} from '@billing/ratio-config';

import type { ModelCost, ProviderBillingRule } from './api';
import { formatMoney } from './format';

const STORAGE_KEY = 'llm-metadata.newapi';

export type ExchangeRates = Readonly<Record<string, number>>;

interface NewApiContextValue {
  deployment: NewApiDeployment;
  /** 出厂设置 + 清单汇率；用户配置与之相同时视为未自定义 */
  defaults: NewApiDeployment;
  /** 清单 newapi.exchangeRates：USD/CNY 之外货币的真实汇率兜底 */
  exchangeRates: ExchangeRates;
  customized: boolean;
  setDeployment: (next: NewApiDeployment) => void;
}

const NewApiContext = createContext<NewApiContextValue | null>(null);

function readStored(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function writeStored(deployment: NewApiDeployment | null): void {
  try {
    if (deployment) localStorage.setItem(STORAGE_KEY, JSON.stringify(deployment));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 存储不可用时仅在当前会话生效
  }
}

/**
 * 仅在用户偏离默认时持久化；默认部署随清单汇率变化，未自定义的用户始终跟随静态预设。
 */
export function NewApiProvider({
  exchangeRates,
  children,
}: {
  exchangeRates: ExchangeRates;
  children: ReactNode;
}) {
  const defaults = useMemo(() => defaultDeployment(exchangeRates), [exchangeRates]);
  const [stored, setStored] = useState<unknown>(readStored);

  const deployment = useMemo(
    () => (stored ? sanitizeDeployment(stored, defaults) : defaults),
    [stored, defaults],
  );

  const setDeployment = useCallback(
    (next: NewApiDeployment) => {
      const clean = sanitizeDeployment(next, defaults);
      const value = sameDeployment(clean, defaults) ? null : clean;
      setStored(value);
      writeStored(value);
    },
    [defaults],
  );

  const value = useMemo<NewApiContextValue>(
    () => ({
      deployment,
      defaults,
      exchangeRates,
      customized: !sameDeployment(deployment, defaults),
      setDeployment,
    }),
    [deployment, defaults, exchangeRates, setDeployment],
  );
  return <NewApiContext.Provider value={value}>{children}</NewApiContext.Provider>;
}

export function useNewApi(): NewApiContextValue {
  const context = useContext(NewApiContext);
  if (!context) throw new Error('useNewApi must be used within NewApiProvider');
  return context;
}

/** 单个模型在给定部署下的表达式及其采用的官方价目货币 */
export interface ModelExpr {
  expr: string;
  sheetCurrency: Currency;
}

export function modelExpr(
  cost: ModelCost | undefined,
  billing: ProviderBillingRule | undefined,
  deployment: NewApiDeployment,
  exchangeRates: ExchangeRates,
): ModelExpr | undefined {
  const result = buildDeploymentBillingExpr(cost, billing ?? {}, deployment, exchangeRates);
  return result.expr === null
    ? undefined
    : { expr: result.expr, sheetCurrency: result.sheetCurrency };
}

/** 单个供应商的 /api/ratio_config 载荷（与托管文件同形，按当前部署生成） */
export function providerRatioConfig(
  provider: RatioConfigProvider,
  deployment: NewApiDeployment,
  exchangeRates: ExchangeRates,
): NewApiPriceConfig {
  return buildRatioConfig([provider], deployment, exchangeRates).config;
}

/** 系数单位说明："1 quota-USD" 在该部署上显示为多少展示货币（如 "¥7.3"） */
export function quotaUsdDisplay(deployment: NewApiDeployment): string {
  return formatMoney(displaySymbol(deployment), displayRate(deployment));
}
