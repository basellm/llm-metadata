import { useMemo, type ReactNode } from 'react';
import { CalendarDays } from 'lucide-react';

import { CopyButton } from '@/components/copy-button';
import { ModalityIcons } from '@/components/modality-icons';
import { ModelBadges } from '@/components/model-badges';
import { ModelsEmpty } from '@/components/models-empty';
import { ProviderIcon } from '@/components/provider-icon';
import type { Model, ProviderIndexItem } from '@/lib/api';
import { formatContext, formatDate, formatTokenPrice } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_DIRECTION, buildModelRows, type ModelRow } from '@/lib/model-rows';
import { inputPriceLabel } from '@/lib/pricing';

/** 卡片内的一项基础信息（标签左、值右） */
function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="truncate font-mono tabular-nums">{value}</dd>
    </div>
  );
}

function ModelCard({
  row: { model, pricing, isNew },
  provider,
  onOpen,
}: {
  row: ModelRow;
  provider: ProviderIndexItem;
  onOpen: () => void;
}) {
  const { locale, t } = useI18n();
  const name = model.name || model.id;

  return (
    <article
      onClick={onOpen}
      className="bg-card hover:border-foreground/20 flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-colors"
    >
      <header className="flex items-start gap-3">
        <ProviderIcon
          id={provider.id}
          name={provider.name}
          iconURL={provider.iconURL}
          className="size-9 shrink-0 rounded-md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
              aria-label={t('table.viewDetails', { model: name })}
              className="focus-visible:ring-ring/50 truncate rounded-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              {name}
            </button>
            <ModelBadges pricing={pricing} isNew={isNew} />
          </div>
          <div className="text-muted-foreground flex items-center gap-0.5 font-mono text-xs">
            <span className="truncate">{model.id}</span>
            <CopyButton text={model.id} />
          </div>
        </div>
      </header>

      {model.description && (
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
          {model.description}
        </p>
      )}

      <dl className="bg-muted/40 mt-auto grid grid-cols-2 gap-x-5 gap-y-2 rounded-md px-3 py-2.5 text-[13px]">
        <Stat
          label={t('card.inputTypes')}
          value={<ModalityIcons supported={new Set(model.modalities?.input)} className="gap-1.5" />}
        />
        <Stat
          label={t('card.outputTypes')}
          value={
            <ModalityIcons supported={new Set(model.modalities?.output)} className="gap-1.5" />
          }
        />
        <Stat label={t('table.input')} value={inputPriceLabel(pricing)} />
        <Stat
          label={t('table.output')}
          value={formatTokenPrice(pricing.symbol, pricing.base.output)}
        />
        <Stat label={t('table.context')} value={formatContext(model.limit?.context)} />
        <Stat label={t('detail.maxOutputShort')} value={formatContext(model.limit?.output)} />
      </dl>

      {model.release_date && (
        <footer className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <CalendarDays aria-hidden className="size-3.5" />
          {t('table.released')} · {formatDate(model.release_date, locale)}
        </footer>
      )}
    </article>
  );
}

/** 卡片视图：按发布时间倒序的响应式网格，展示基础信息 */
export function ModelCards({
  models,
  query,
  billingExpr,
  provider,
  onOpenModel,
}: {
  models: Model[];
  query: string;
  billingExpr: Record<string, string> | null;
  provider: ProviderIndexItem;
  onOpenModel: (id: string) => void;
}) {
  const { locale, t } = useI18n();
  const rows = useMemo(
    () =>
      buildModelRows(models, {
        query,
        billingExpr,
        sortKey: 'released',
        direction: DEFAULT_DIRECTION.released,
        t,
        locale,
      }),
    [models, query, billingExpr, t, locale],
  );

  if (rows.length === 0) return <ModelsEmpty />;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {rows.map((row) => (
          <ModelCard
            key={row.model.id}
            row={row}
            provider={provider}
            onOpen={() => onOpenModel(row.model.id)}
          />
        ))}
      </div>
    </div>
  );
}
