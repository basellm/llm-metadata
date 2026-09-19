import { useMemo, type ReactNode } from 'react';
import { CalendarDays, SearchX } from 'lucide-react';

import { CopyButton } from '@/components/copy-button';
import { ModalityIcons } from '@/components/modality-icons';
import { ModelBadges } from '@/components/model-badges';
import { PriceValue } from '@/components/price-value';
import { ProviderIcon } from '@/components/provider-icon';
import { StatePanel } from '@/components/state-panel';
import { BlurFade } from '@/components/ui/blur-fade';
import { MagicCard } from '@/components/ui/magic-card';
import { ShineBorder } from '@/components/ui/shine-border';
import type { Model, ProviderIndexItem } from '@/lib/api';
import { formatContext, formatDate } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_DIRECTION, buildModelRows, type ModelRow } from '@/lib/model-rows';
import { useNewApi } from '@/lib/newapi';
import { cn } from '@/lib/utils';

/** 卡片网格：按最小卡宽自适应列数（窄屏退化为单列且不横向溢出） */
export const CARD_GRID = 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(21rem,100%),1fr))]';

/** 仅首屏（前 ANIMATED_CARDS 张）卡片交错渐入，其余直接呈现：大列表下不为每张卡片挂载动画运行时 */
const ANIMATED_CARDS = 12;
const STAGGER_STEP = 0.04;

/** 卡片内的一项基础信息（标签左、值右） */
function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="font-mono whitespace-nowrap tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * 模型卡片：MagicCard 让边框与内部聚光灯跟随指针；新发布模型的边框流转高光；
 * 首屏卡片按序号交错渐入。
 */
function ModelCard({
  row: { model, pricing, isNew },
  provider,
  index,
  onOpen,
}: {
  row: ModelRow;
  provider: ProviderIndexItem;
  index: number;
  onOpen: () => void;
}) {
  const { locale, t } = useI18n();
  const name = model.name || model.id;

  const card = (
    <>
      <MagicCard className="h-full rounded-[inherit]">
        <article
          onClick={onOpen}
          className={cn(
            'flex h-full cursor-pointer flex-col gap-3 p-4',
            model.status === 'deprecated' && 'opacity-70',
          )}
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
                <ModelBadges
                  pricing={pricing}
                  isNew={isNew}
                  status={model.status}
                  providerCurrency={provider.currency}
                />
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
              className="col-span-2"
              label={t('card.inputTypes')}
              value={<ModalityIcons supported={new Set(model.modalities?.input)} />}
            />
            <Stat
              className="col-span-2"
              label={t('card.outputTypes')}
              value={<ModalityIcons supported={new Set(model.modalities?.output)} />}
            />
            <Stat
              label={t('table.input')}
              value={<PriceValue pricing={pricing} column="input" />}
            />
            <Stat
              label={t('table.output')}
              value={<PriceValue pricing={pricing} column="output" />}
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
      </MagicCard>
      {isNew && <ShineBorder shineColor="var(--color-primary)" duration={10} />}
    </>
  );

  return index < ANIMATED_CARDS ? (
    <BlurFade delay={index * STAGGER_STEP} className="relative rounded-lg">
      {card}
    </BlurFade>
  ) : (
    <div className="relative rounded-lg">{card}</div>
  );
}

/** 卡片视图：按发布时间倒序的响应式网格，展示基础信息 */
export function ModelCards({
  models,
  query,
  provider,
  onOpenModel,
}: {
  models: Model[];
  query: string;
  provider: ProviderIndexItem;
  onOpenModel: (id: string) => void;
}) {
  const { locale, t } = useI18n();
  const { deployment, exchangeRates } = useNewApi();
  const rows = useMemo(
    () =>
      buildModelRows(models, {
        query,
        providerCurrency: provider.currency,
        billing: provider.billing,
        deployment,
        exchangeRates,
        sortKey: 'released',
        direction: DEFAULT_DIRECTION.released,
        t,
        locale,
      }),
    [models, query, provider.currency, provider.billing, deployment, exchangeRates, t, locale],
  );

  if (rows.length === 0) return <StatePanel icon={SearchX} message={t('table.empty')} />;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className={CARD_GRID}>
        {rows.map((row, index) => (
          <ModelCard
            key={row.model.id}
            row={row}
            provider={provider}
            index={index}
            onOpen={() => onOpenModel(row.model.id)}
          />
        ))}
      </div>
    </div>
  );
}
