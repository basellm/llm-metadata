// new-api 倍率同步载荷（/api/ratio_config 形状）：全部模型以 tiered_expr 表达式计费，
// 不含 model_ratio / completion_ratio / cache_ratio / model_price。
// 构建脚本（静态预设）与 Web UI（按部署配置即时生成 / 导出）共用同一生成逻辑。

import type { ModelCost, ProviderBillingRule } from './cost.js';
import { buildDeploymentBillingExpr, type NewApiDeployment } from './deployment.js';

export interface NewApiPriceConfig {
  data: {
    /** 计费模式（恒为 "tiered_expr"） */
    billing_mode: Record<string, 'tiered_expr'>;
    /** 计费表达式（expr-lang 语法，系数单位 quota-USD / 1M tokens；按次为 fixed(quota-USD)） */
    billing_expr: Record<string, string>;
  };
  message: string;
  success: boolean;
}

/** 生成价格配置所需的最小供应商形状 */
export interface RatioConfigProvider {
  id: string;
  models: Record<string, { cost?: ModelCost }>;
  billing?: ProviderBillingRule;
}

export interface RatioConfigResult {
  config: NewApiPriceConfig;
  warnings: string[];
}

function priorityOf(provider: RatioConfigProvider): number {
  return provider.billing?.priority ?? 0;
}

/** 按优先级降序、ID 升序排列供应商，保证同名模型冲突解析的确定性 */
export function sortByPriority<T extends RatioConfigProvider>(providers: readonly T[]): T[] {
  return [...providers].sort((a, b) => priorityOf(b) - priorityOf(a) || a.id.localeCompare(b.id));
}

/**
 * 为一组供应商生成 ratio_config：每个可定价模型一条 tiered_expr 表达式；
 * 同名模型跨供应商时归属优先级最高者；价目货币缺少汇率的模型跳过并汇总警告。
 */
export function buildRatioConfig(
  providers: readonly RatioConfigProvider[],
  deployment: NewApiDeployment,
  fallbackFx?: Readonly<Record<string, number>>,
): RatioConfigResult {
  const config: NewApiPriceConfig = {
    data: { billing_mode: {}, billing_expr: {} },
    message: '',
    success: true,
  };
  const warnings: string[] = [];
  const skipped = new Map<string, number>();
  const claimed = new Set<string>();

  for (const provider of sortByPriority(providers)) {
    for (const [modelId, model] of Object.entries(provider.models)) {
      if (claimed.has(modelId)) continue;

      const result = buildDeploymentBillingExpr(
        model.cost,
        provider.billing ?? {},
        deployment,
        fallbackFx,
      );
      if (result.unknownCurrency) {
        const key = `${provider.id}\u0000${result.unknownCurrency}`;
        skipped.set(key, (skipped.get(key) ?? 0) + 1);
        continue;
      }
      warnings.push(...result.warnings.map((w) => `newapi: ${provider.id}/${modelId}: ${w}`));
      if (result.expr === null) continue;

      claimed.add(modelId);
      config.data.billing_mode[modelId] = 'tiered_expr';
      config.data.billing_expr[modelId] = result.expr;
    }
  }

  const currencyWarnings = [...skipped.entries()].map(([key, count]) => {
    const [providerId, currency] = key.split('\u0000');
    return `newapi: skipped pricing for ${count} model(s) from "${providerId}" (no exchange rate for ${currency})`;
  });
  return { config, warnings: [...currencyWarnings, ...warnings] };
}
