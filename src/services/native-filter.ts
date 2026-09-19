import { COST_FAMILIES } from '../billing/cost-families.js';
import { isCurrency, type Currency } from '../billing/currencies.js';
import type {
  CurrencyOptions,
  Model,
  ModelCost,
  NativeProvidersConfig,
  NormalizedData,
  Provider,
  ProviderBillingRule,
} from '../types/index.js';

/** 过滤结果 */
export interface NativeFilterResult {
  data: NormalizedData;
  excludedProviders: number;
  excludedModels: number;
  warnings: string[];
}

/**
 * 原生供应商过滤服务。
 *
 * 上游 models.dev 混杂了大量聚合商/转售商，本服务依据
 * data/native-providers.json 白名单只保留第一方（原生）供应商，
 * 并可按规则剔除原生供应商中托管的第三方模型；同时把目录中的
 * 供应商属性（lobeIcon、结算货币、订阅标记、计费规则）注入数据并校验价目货币的一致性。
 */
export class NativeFilter {
  private readonly excludePatterns = new Map<string, RegExp[]>();
  private readonly providerRules: Record<string, ProviderBillingRule> = {};
  private readonly providerCurrencies = new Map<string, Currency>();
  private readonly configWarnings: string[] = [];

  constructor(private readonly config: NativeProvidersConfig | null) {
    if (!config) return;

    for (const [providerId, rule] of Object.entries(config.providers)) {
      const patterns: RegExp[] = [];
      for (const pattern of rule.excludeModels || []) {
        try {
          patterns.push(new RegExp(pattern, 'i'));
        } catch {
          this.configWarnings.push(
            `native-providers: invalid excludeModels pattern "${pattern}" for "${providerId}" (ignored)`,
          );
        }
      }
      if (patterns.length > 0) {
        this.excludePatterns.set(providerId, patterns);
      }
      this.providerRules[providerId] = this.sanitizeBillingRule(providerId, rule);

      if (rule.currency !== undefined) {
        if (isCurrency(rule.currency)) {
          this.providerCurrencies.set(providerId, rule.currency);
        } else {
          this.configWarnings.push(
            `native-providers: invalid currency "${String(rule.currency)}" for "${providerId}" (ignored)`,
          );
        }
      }
      if (rule.subscription !== undefined && typeof rule.subscription !== 'boolean') {
        this.configWarnings.push(
          `native-providers: invalid subscription "${String(rule.subscription)}" for "${providerId}" (must be a boolean; ignored)`,
        );
      }
    }

    for (const [currency, rate] of Object.entries(config.exchangeRates || {})) {
      if (currency.startsWith('$')) continue; // $comment 等元数据键
      if (typeof rate !== 'number' || rate <= 0) {
        this.configWarnings.push(
          `native-providers: invalid exchange rate for "${currency}" (must be a positive number)`,
        );
      }
    }

    // 非 USD 端点缺少汇率时，其价目无法进入 NewAPI / VoAPI 的 USD 输出
    const rates = this.getExchangeRates();
    for (const [providerId, currency] of this.providerCurrencies) {
      if (currency !== 'USD' && rates[currency] === undefined) {
        this.configWarnings.push(
          `native-providers: "${providerId}" bills in ${currency} but exchangeRates.${currency} is missing (USD outputs will skip its prices)`,
        );
      }
    }
  }

  /** 校验供应商级计费规则，非法字段丢弃并警告 */
  private sanitizeBillingRule(providerId: string, rule: ProviderBillingRule): ProviderBillingRule {
    const sanitized: ProviderBillingRule = {};
    const warn = (field: string, requirement: string) =>
      this.configWarnings.push(
        `native-providers: invalid ${field} for "${providerId}" (${requirement}; ignored)`,
      );

    if (rule.priority !== undefined) {
      if (typeof rule.priority === 'number' && Number.isFinite(rule.priority)) {
        sanitized.priority = rule.priority;
      } else warn('priority', 'must be a number');
    }
    if (rule.thinkingToggle !== undefined) {
      const { param, value } = rule.thinkingToggle ?? {};
      if (
        typeof param === 'string' &&
        param &&
        ['boolean', 'string', 'number'].includes(typeof value)
      ) {
        sanitized.thinkingToggle = { param, value };
      } else warn('thinkingToggle', 'needs a non-empty param and a boolean/string/number value');
    }
    if (rule.cacheWrite1h !== undefined) {
      if (typeof rule.cacheWrite1h === 'number' && rule.cacheWrite1h > 0) {
        sanitized.cacheWrite1h = rule.cacheWrite1h;
      } else warn('cacheWrite1h', 'must be a positive number');
    }
    return sanitized;
  }

  /** 非 USD 货币兑美元汇率（每 1 USD 对应的货币数量） */
  getExchangeRates(): Record<string, number> {
    const rates: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(this.config?.exchangeRates || {})) {
      if (!currency.startsWith('$') && typeof rate === 'number' && rate > 0) {
        rates[currency] = rate;
      }
    }
    return rates;
  }

  /** 价目是否含正的计费家族价格（全 0 的免费 / 订阅模型与货币无关） */
  private static hasPositivePrice(cost: ModelCost | undefined): boolean {
    return (
      !!cost &&
      COST_FAMILIES.some((family) => {
        const value = cost[family];
        return typeof value === 'number' && value > 0;
      })
    );
  }

  /**
   * 校验单个模型的价目货币并返回清洗后的模型：
   * - currency_options 只接受已知且不同于主货币的键，其余丢弃并警告；
   * - 主货币与端点货币不一致时警告（覆写填错端点的常见错误）。
   * 返回该模型是否为“非 USD 端点上仍沿用上游 USD 数值”的估算价。
   */
  private auditModelCurrency(
    providerId: string,
    modelId: string,
    model: Model,
    providerCurrency: Currency,
    warnings: string[],
  ): { model: Model; estimated: boolean } {
    const cost = model.cost;
    if (!cost) return { model, estimated: false };

    const declared = cost.currency;
    if (declared !== undefined && declared !== providerCurrency) {
      warnings.push(
        `pricing: ${providerId}/${modelId}: cost.currency ${declared} differs from the provider billing currency ${providerCurrency}`,
      );
    }

    let cleaned = model;
    if (cost.currency_options !== undefined) {
      const main = declared ?? 'USD';
      const options: CurrencyOptions = {};
      for (const [key, value] of Object.entries(cost.currency_options)) {
        if (!isCurrency(key) || key === main || !value || typeof value !== 'object') {
          warnings.push(
            `pricing: ${providerId}/${modelId}: invalid currency_options entry "${key}" (dropped)`,
          );
          continue;
        }
        options[key] = value;
      }
      cleaned = { ...model, cost: { ...cost, currency_options: options } };
    }

    const estimated =
      providerCurrency !== 'USD' && declared === undefined && NativeFilter.hasPositivePrice(cost);
    return { model: cleaned, estimated };
  }

  /** 应用白名单、模型排除规则与货币审计 */
  apply(normalized: NormalizedData): NativeFilterResult {
    if (!this.config) {
      return {
        data: normalized,
        excludedProviders: 0,
        excludedModels: 0,
        warnings: ['native-providers: data/native-providers.json not found; filtering disabled'],
      };
    }

    const warnings = [...this.configWarnings];
    const providers: Record<string, Provider> = {};
    let excludedProviders = 0;
    let excludedModels = 0;

    for (const [providerId, provider] of Object.entries(normalized.providers)) {
      const rule = this.config.providers[providerId];
      if (!rule) {
        excludedProviders++;
        continue;
      }

      // 目录中的 lobeIcon / 结算货币 / 订阅标记 / 计费规则注入供应商数据（lobeIcon 不覆盖已有值）
      const currency = this.providerCurrencies.get(providerId);
      const billing = this.providerRules[providerId];
      const enriched: Provider = {
        ...provider,
        ...(rule.lobeIcon && !provider.lobeIcon ? { lobeIcon: rule.lobeIcon } : {}),
        ...(currency ? { currency } : {}),
        ...(rule.subscription === true ? { subscription: true } : {}),
        ...(billing && Object.keys(billing).length > 0 ? { billing } : {}),
      };

      const patterns = this.excludePatterns.get(providerId) ?? [];
      const providerCurrency = currency ?? 'USD';
      const models: Record<string, Model> = {};
      let estimatedModels = 0;
      for (const [modelId, model] of Object.entries(enriched.models || {})) {
        if (patterns.some((pattern) => pattern.test(modelId))) {
          excludedModels++;
          continue;
        }
        const audited = this.auditModelCurrency(
          providerId,
          modelId,
          model,
          providerCurrency,
          warnings,
        );
        if (audited.estimated) estimatedModels++;
        models[modelId] = audited.model;
      }
      if (estimatedModels > 0) {
        warnings.push(
          `pricing: "${providerId}" bills in ${providerCurrency} but ${estimatedModels} model(s) still carry upstream USD estimates; add cost overrides with "currency": "${providerCurrency}"`,
        );
      }
      providers[providerId] = { ...enriched, models };
    }

    // 配置漂移检测：白名单中的供应商在上游消失时提醒维护者
    for (const providerId of Object.keys(this.config.providers)) {
      if (!normalized.providers[providerId]) {
        warnings.push(`native-providers: "${providerId}" not found in source data`);
      }
    }

    return { data: { providers }, excludedProviders, excludedModels, warnings };
  }
}
