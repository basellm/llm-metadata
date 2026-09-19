import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Download, SlidersHorizontal } from 'lucide-react';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCIES, type Currency } from '@billing/currencies';
import {
  QUOTA_DISPLAY_TYPES,
  displaySymbol,
  sanitizeDeployment,
  type NewApiDeployment,
  type QuotaDisplayType,
} from '@billing/deployment';
import { buildRatioConfig } from '@billing/ratio-config';
import { fetchAllProviders } from '@/lib/api';
import { useI18n, type MessageKey, type Translator } from '@/lib/i18n';
import { quotaUsdDisplay, useNewApi } from '@/lib/newapi';
import { cn } from '@/lib/utils';

const BUTTON =
  'focus-visible:ring-ring/50 inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';
const BUTTON_GHOST = cn(BUTTON, 'border-input hover:bg-accent');
const BUTTON_PRIMARY = cn(
  BUTTON,
  'bg-primary text-primary-foreground border-primary hover:opacity-90',
);
const IMPORT_TIMEOUT_MS = 10_000;

/** 表单草稿：数值以原始字符串保存，允许输入过程中的中间状态 */
interface Draft {
  quotaDisplayType: QuotaDisplayType;
  usdExchangeRate: string;
  customCurrencySymbol: string;
  customCurrencyExchangeRate: string;
  usdSettlementRate: string;
  preferredListCurrency: Currency;
}

function toDraft(deployment: NewApiDeployment): Draft {
  return {
    quotaDisplayType: deployment.quotaDisplayType,
    usdExchangeRate: String(deployment.usdExchangeRate),
    customCurrencySymbol: deployment.customCurrencySymbol,
    customCurrencyExchangeRate: String(deployment.customCurrencyExchangeRate),
    usdSettlementRate: deployment.usdSettlementRate > 0 ? String(deployment.usdSettlementRate) : '',
    preferredListCurrency: deployment.preferredListCurrency,
  };
}

function parsePositive(raw: string): number | null {
  const value = Number(raw.trim());
  return raw.trim() && Number.isFinite(value) && value > 0 ? value : null;
}

/** 校验草稿；返回各字段错误（消息键）与可保存的部署配置（未校验字段回退 defaults） */
function validateDraft(
  draft: Draft,
  defaults: NewApiDeployment,
): {
  errors: Partial<Record<keyof Draft, MessageKey>>;
  deployment: NewApiDeployment | null;
} {
  const errors: Partial<Record<keyof Draft, MessageKey>> = {};
  // USDExchangeRate 在任何展示类型下都参与换算（非 CNY 展示时作为官方人民币价目的真实汇率）
  const usdExchangeRate = parsePositive(draft.usdExchangeRate);
  if (usdExchangeRate === null) errors.usdExchangeRate = 'newapi.mustBePositive';
  const customRate = parsePositive(draft.customCurrencyExchangeRate);
  const symbol = draft.customCurrencySymbol.trim();
  if (draft.quotaDisplayType === 'CUSTOM') {
    if (customRate === null) errors.customCurrencyExchangeRate = 'newapi.mustBePositive';
    if (!symbol) errors.customCurrencySymbol = 'newapi.symbolRequired';
  }
  const settlementRaw = draft.usdSettlementRate.trim();
  const settlement = settlementRaw ? Number(settlementRaw) : 0;
  if (!Number.isFinite(settlement) || settlement < 0) {
    errors.usdSettlementRate = 'newapi.mustBeNonNegative';
  }
  if (Object.keys(errors).length > 0) return { errors, deployment: null };
  return {
    errors,
    deployment: sanitizeDeployment(
      {
        quotaDisplayType: draft.quotaDisplayType,
        usdExchangeRate,
        customCurrencySymbol: symbol,
        customCurrencyExchangeRate: customRate,
        usdSettlementRate: settlement,
        preferredListCurrency: draft.preferredListCurrency,
      },
      defaults,
    ),
  };
}

/** 把 new-api 公开的 /api/status 字段映射为部署配置（TOKENS 展示在计费上等同 USD） */
function deploymentFromStatus(data: Record<string, unknown>): Partial<NewApiDeployment> {
  const type = data.quota_display_type;
  return {
    quotaDisplayType:
      type === 'CNY' || type === 'CUSTOM'
        ? type
        : type === 'USD' || type === 'TOKENS'
          ? 'USD'
          : undefined,
    usdExchangeRate: data.usd_exchange_rate as number | undefined,
    customCurrencySymbol: data.custom_currency_symbol as string | undefined,
    customCurrencyExchangeRate: data.custom_currency_exchange_rate as number | undefined,
    usdSettlementRate: data.usd_settlement_rate as number | undefined,
  };
}

/** new-api 站点地址 → /api/status 地址；仅接受 http(s)，保留子路径部署 */
function statusEndpoint(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/api/status`;
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? (
        <span className="text-warning text-xs">{error}</span>
      ) : (
        hint && <span className="text-muted-foreground text-xs leading-relaxed">{hint}</span>
      )}
    </label>
  );
}

function typeLabel(type: QuotaDisplayType, t: Translator): string {
  return t(`newapi.type.${type}`);
}

/** 站点导入：读取 new-api 公开的 /api/status 填充草稿 */
function ImportRow({ onImport }: { onImport: (partial: Partial<NewApiDeployment>) => void }) {
  const { t } = useI18n();
  const [url, setUrl] = useState('');
  const [state, setState] = useState<
    | { status: 'idle' | 'loading' }
    | { status: 'ok'; host: string }
    | { status: 'error'; message: string }
  >({ status: 'idle' });

  const run = async () => {
    const endpoint = statusEndpoint(url);
    if (!endpoint) {
      setState({ status: 'error', message: t('newapi.invalidUrl') });
      return;
    }
    setState({ status: 'loading' });
    try {
      const response = await fetch(endpoint, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(IMPORT_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { data?: unknown };
      if (typeof payload.data !== 'object' || payload.data === null) {
        throw new Error('missing data');
      }
      onImport(deploymentFromStatus(payload.data as Record<string, unknown>));
      setState({ status: 'ok', host: endpoint.host });
    } catch (error) {
      setState({
        status: 'error',
        message: t('newapi.importFailed', {
          reason: error instanceof Error ? error.message : String(error),
        }),
      });
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{t('newapi.importUrl')}</span>
      <div className="flex gap-2">
        <Input
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void run();
            }
          }}
          placeholder="https://your-new-api.example.com"
          aria-label={t('newapi.importUrl')}
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={state.status === 'loading' || !url.trim()}
          className={cn(BUTTON_GHOST, 'h-9 shrink-0')}
        >
          {state.status === 'loading' ? t('newapi.importing') : t('newapi.import')}
        </button>
      </div>
      <span
        className={cn(
          'text-xs leading-relaxed',
          state.status === 'error' ? 'text-warning' : 'text-muted-foreground',
        )}
      >
        {state.status === 'ok'
          ? t('newapi.imported', { host: state.host })
          : state.status === 'error'
            ? state.message
            : t('newapi.importHint')}
      </span>
    </div>
  );
}

/** new-api 计费配置入口：头部胶囊按钮 + 对话框 */
export function NewApiSettings() {
  const { t } = useI18n();
  const { deployment, defaults, exchangeRates, customized, setDeployment } = useNewApi();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(deployment));
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'error'>('idle');

  const { errors, deployment: candidate } = useMemo(
    () => validateDraft(draft, defaults),
    [draft, defaults],
  );
  const patch = useCallback((partial: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...partial }));
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(toDraft(deployment));
      setExportState('idle');
    }
    setOpen(next);
  };

  const handleSave = () => {
    if (!candidate) return;
    setDeployment(candidate);
    setOpen(false);
  };

  // 站点字段整体替换草稿（缺失字段回退 new-api 出厂默认）；价目货币偏好与站点无关，保留
  const handleImport = (partial: Partial<NewApiDeployment>) => {
    setDraft((current) =>
      toDraft(
        sanitizeDeployment(
          { ...partial, preferredListCurrency: current.preferredListCurrency },
          defaults,
        ),
      ),
    );
  };

  // 导出全部供应商的聚合 ratio_config（同名模型按优先级归属），供托管后作为 new-api 倍率同步上游
  const handleExport = async () => {
    if (!candidate) return;
    setExportState('loading');
    try {
      const providers = Object.values(await fetchAllProviders());
      const { config } = buildRatioConfig(providers, candidate, exchangeRates);
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `ratio_config-v1-${candidate.quotaDisplayType.toLowerCase()}.json`;
      anchor.click();
      URL.revokeObjectURL(href);
      setExportState('idle');
    } catch {
      setExportState('error');
    }
  };

  const errorText = (key: keyof Draft) => (errors[key] ? t(errors[key]) : undefined);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        aria-label={t('newapi.title')}
        title={customized ? t('newapi.customized') : t('newapi.title')}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex h-8 items-center gap-1.5 rounded-md px-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <SlidersHorizontal className="size-4" />
        <span className="hidden sm:inline">new-api</span>
        {customized && (
          <span className="bg-primary/10 text-primary rounded px-1.5 py-px font-mono text-[11px]">
            {displaySymbol(deployment)}
          </span>
        )}
      </DialogTrigger>
      <DialogContent closeLabel={t('newapi.close')}>
        <DialogHeader>
          <DialogTitle>{t('newapi.title')}</DialogTitle>
          <DialogDescription>{t('newapi.description')}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <ImportRow onImport={handleImport} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('newapi.displayType')} hint={t('newapi.displayTypeHint')}>
              <Select
                value={draft.quotaDisplayType}
                onValueChange={(value) => patch({ quotaDisplayType: value as QuotaDisplayType })}
              >
                <SelectTrigger aria-label={t('newapi.displayType')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTA_DISPLAY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabel(type, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label={t(
                draft.quotaDisplayType === 'CNY'
                  ? 'newapi.usdExchangeRate'
                  : 'newapi.usdExchangeRateReal',
              )}
              hint={t(
                draft.quotaDisplayType === 'CNY'
                  ? 'newapi.usdExchangeRateHint'
                  : 'newapi.usdExchangeRateRealHint',
              )}
              error={errorText('usdExchangeRate')}
            >
              <Input
                inputMode="decimal"
                value={draft.usdExchangeRate}
                onChange={(e) => patch({ usdExchangeRate: e.target.value })}
              />
            </Field>

            {draft.quotaDisplayType === 'CUSTOM' && (
              <>
                <Field label={t('newapi.customSymbol')} error={errorText('customCurrencySymbol')}>
                  <Input
                    maxLength={8}
                    value={draft.customCurrencySymbol}
                    onChange={(e) => patch({ customCurrencySymbol: e.target.value })}
                  />
                </Field>
                <Field
                  label={t('newapi.customRate')}
                  hint={t('newapi.customRateHint')}
                  error={errorText('customCurrencyExchangeRate')}
                >
                  <Input
                    inputMode="decimal"
                    value={draft.customCurrencyExchangeRate}
                    onChange={(e) => patch({ customCurrencyExchangeRate: e.target.value })}
                  />
                </Field>
              </>
            )}

            <Field
              label={t('newapi.settlementRate')}
              hint={t('newapi.settlementRateHint')}
              error={errorText('usdSettlementRate')}
            >
              <Input
                inputMode="decimal"
                value={draft.usdSettlementRate}
                onChange={(e) => patch({ usdSettlementRate: e.target.value })}
                placeholder={t('newapi.settlementUnset')}
              />
            </Field>

            <Field label={t('newapi.preferredList')} hint={t('newapi.preferredListHint')}>
              <Select
                value={draft.preferredListCurrency}
                onValueChange={(value) => patch({ preferredListCurrency: value as Currency })}
              >
                <SelectTrigger aria-label={t('newapi.preferredList')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="bg-muted/40 rounded-md px-3 py-2.5 text-xs leading-relaxed">
            <div className="font-medium">
              {candidate
                ? t('newapi.summary', { display: quotaUsdDisplay(candidate) })
                : t('newapi.summaryInvalid')}
            </div>
            <div className="text-muted-foreground mt-1">{t('newapi.unaffected')}</div>
          </div>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={!candidate || exportState === 'loading'}
            className={cn(BUTTON_GHOST, 'mr-auto')}
          >
            <Download className="size-3.5" />
            {exportState === 'loading'
              ? t('newapi.exporting')
              : exportState === 'error'
                ? t('newapi.exportFailed')
                : t('newapi.exportAll')}
          </button>
          <button
            type="button"
            onClick={() => setDraft(toDraft(defaults))}
            className={BUTTON_GHOST}
          >
            {t('newapi.reset')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!candidate}
            className={BUTTON_PRIMARY}
          >
            {t('newapi.save')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
