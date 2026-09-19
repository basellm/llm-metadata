import { Fragment, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, SearchX } from 'lucide-react';

import { ExprBlock } from '@/components/expr-block';
import { ModelBadges } from '@/components/model-badges';
import { PriceValue } from '@/components/price-value';
import { StatePanel } from '@/components/state-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Model, ProviderBillingRule } from '@/lib/api';
import { formatContext, formatDate, formatTokenPrice } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import {
  DEFAULT_DIRECTION,
  buildModelRows,
  type SortDirection,
  type SortKey,
} from '@/lib/model-rows';
import { useNewApi, type ModelExpr } from '@/lib/newapi';
import type { DetailRow, ModelPricing } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const NUMERIC_CELL = 'text-right font-mono text-[13px] tabular-nums';
/** 明细子行首格：连续左引导线（单元格无内边距，由内层容器撑起整高） */
const GUIDE = 'ml-[26px] border-l pl-4';
const DETAIL_ROW = 'border-0 bg-muted/20 hover:bg-muted/20';

/** 展开块中的子行：淡入出现（tr 不能被包裹，逐行动画） */
const MotionTableRow = motion.create(TableRow);
const DETAIL_ROW_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2 },
} as const;

function SortableHead({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const Icon = active ? (direction === 1 ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead
      aria-sort={active ? (direction === 1 ? 'ascending' : 'descending') : 'none'}
      className={className}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-sm tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none',
          active && 'text-foreground',
        )}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </TableHead>
  );
}

/** 明细子行：标签 + 与主表对齐的四个价格列（时段行标记当前所处时段） */
function DetailPriceRow({
  row,
  symbol,
  isLast,
}: {
  row: DetailRow;
  symbol: string;
  isLast: boolean;
}) {
  const { t } = useI18n();
  const cell = (value: number | null) => (
    <span className={value === null ? 'text-muted-foreground/40' : 'text-muted-foreground'}>
      {formatTokenPrice(symbol, value)}
    </span>
  );
  return (
    <MotionTableRow {...DETAIL_ROW_MOTION} className={cn(DETAIL_ROW, isLast && 'border-b')}>
      <TableCell className="p-0 pl-3">
        <div className={cn(GUIDE, 'py-2 text-[13px]')}>
          {row.label}
          {row.active && <Badge className="ml-2 align-middle">{t('pricing.now')}</Badge>}
        </div>
      </TableCell>
      <TableCell colSpan={2} />
      <TableCell className={NUMERIC_CELL}>{cell(row.input)}</TableCell>
      <TableCell className={NUMERIC_CELL}>{cell(row.cacheRead)}</TableCell>
      <TableCell className={NUMERIC_CELL}>{cell(row.cacheWrite)}</TableCell>
      <TableCell className={NUMERIC_CELL}>{cell(row.output)}</TableCell>
    </MotionTableRow>
  );
}

function DetailSectionHeader({ title }: { title: string }) {
  return (
    <MotionTableRow {...DETAIL_ROW_MOTION} className={DETAIL_ROW}>
      <TableCell colSpan={7} className="p-0 pl-3">
        <div
          className={cn(
            GUIDE,
            'text-muted-foreground pt-3 pb-1 text-[11px] font-medium tracking-wider uppercase',
          )}
        >
          {title}
        </div>
      </TableCell>
    </MotionTableRow>
  );
}

/** 展开块中的一个价目（主价目的分组 / 其他货币价目的基础行 + 分组） */
function DetailPricingRows({
  pricing,
  isLast,
  withBaseRow,
}: {
  pricing: ModelPricing;
  isLast: boolean;
  withBaseRow: boolean;
}) {
  const { t } = useI18n();
  const lastSection = pricing.sections[pricing.sections.length - 1];
  return (
    <>
      {withBaseRow && (
        <DetailPriceRow
          row={{ label: t('pricing.base'), ...pricing.base }}
          symbol={pricing.symbol}
          isLast={isLast && pricing.sections.length === 0}
        />
      )}
      {pricing.sections.map((section) => (
        <Fragment key={section.title}>
          <DetailSectionHeader title={section.title} />
          {section.rows.map((row, index) => (
            <DetailPriceRow
              key={row.label}
              row={row}
              symbol={pricing.symbol}
              isLast={isLast && section === lastSection && index === section.rows.length - 1}
            />
          ))}
        </Fragment>
      ))}
    </>
  );
}

/** new-api 表达式计费子行（可复制，恒为展开块末行） */
function DetailExprRow({ expr, primaryCurrency }: { expr: ModelExpr; primaryCurrency: string }) {
  return (
    <MotionTableRow {...DETAIL_ROW_MOTION} className={cn(DETAIL_ROW, 'border-b')}>
      <TableCell colSpan={7} className="p-0 pl-3">
        <ExprBlock
          expr={expr}
          primaryCurrency={primaryCurrency}
          className={cn(GUIDE, 'py-2 pr-3')}
          codeClassName="bg-background/60"
        />
      </TableCell>
    </MotionTableRow>
  );
}

export function PricingTable({
  models,
  query,
  providerCurrency,
  billing,
  onOpenModel,
}: {
  models: Model[];
  query: string;
  providerCurrency: string | undefined;
  billing: ProviderBillingRule | undefined;
  onOpenModel: (id: string) => void;
}) {
  const { locale, t } = useI18n();
  const { deployment, exchangeRates } = useNewApi();
  const [sortKey, setSortKey] = useState<SortKey>('released');
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_DIRECTION.released);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const rows = useMemo(
    () =>
      buildModelRows(models, {
        query,
        providerCurrency,
        billing,
        deployment,
        exchangeRates,
        sortKey,
        direction,
        t,
        locale,
      }),
    [
      models,
      query,
      providerCurrency,
      billing,
      deployment,
      exchangeRates,
      sortKey,
      direction,
      t,
      locale,
    ],
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setDirection(DEFAULT_DIRECTION[key]);
    }
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

  if (rows.length === 0) return <StatePanel icon={SearchX} message={t('table.empty')} />;

  return (
    // 入场动画放在滚动容器之外的包裹层：不给大表格滚动容器附加 filter / transform
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-0 flex-1"
    >
      {/* 表格独立纵向滚动，表头吸顶；横向滚动同容器承载 */}
      <div className="max-h-full overflow-auto overscroll-contain rounded-lg border">
        <Table>
          <TableHeader className="bg-card sticky top-0 z-10 shadow-[inset_0_-1px_0_0_var(--border)] [&_tr]:border-0">
            <TableRow className="bg-card hover:bg-card">
              <SortableHead
                label={t('table.model')}
                sortKey="name"
                activeKey={sortKey}
                direction={direction}
                onSort={handleSort}
              />
              <SortableHead
                label={t('table.released')}
                sortKey="released"
                activeKey={sortKey}
                direction={direction}
                onSort={handleSort}
                className="text-right [&>button]:flex-row-reverse"
              />
              <TableHead className="text-right">{t('table.context')}</TableHead>
              <SortableHead
                label={t('table.input')}
                sortKey="input"
                activeKey={sortKey}
                direction={direction}
                onSort={handleSort}
                className="text-right [&>button]:flex-row-reverse"
              />
              <TableHead className="text-right">{t('table.cacheRead')}</TableHead>
              <TableHead className="text-right">{t('table.cacheWrite')}</TableHead>
              <SortableHead
                label={t('table.output')}
                sortKey="output"
                activeKey={sortKey}
                direction={direction}
                onSort={handleSort}
                className="text-right [&>button]:flex-row-reverse"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ model, pricing, expr, isNew }) => {
              const expandable =
                pricing.sections.length > 0 || pricing.alternates.length > 0 || !!expr;
              const open = expandable && expanded.has(model.id);
              const deprecated = model.status === 'deprecated';
              return (
                <Fragment key={model.id}>
                  <TableRow
                    onClick={() => onOpenModel(model.id)}
                    data-state={open ? 'open' : undefined}
                    className={cn(
                      'cursor-pointer',
                      open && 'bg-muted/20 border-0',
                      deprecated && 'text-muted-foreground',
                    )}
                  >
                    <TableCell className="max-w-80">
                      <div className="flex items-center gap-1.5">
                        {expandable ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggle(model.id);
                            }}
                            aria-expanded={open}
                            aria-label={t(open ? 'table.collapse' : 'table.expand', {
                              model: model.name || model.id,
                            })}
                            className="-ml-1 size-5 rounded-sm hover:bg-transparent"
                          >
                            <ChevronRight
                              className={cn(
                                'size-3.5 transition-transform duration-200',
                                open && 'rotate-90',
                              )}
                            />
                          </Button>
                        ) : (
                          <span aria-hidden className="-ml-1 size-5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onOpenModel(model.id);
                              }}
                              aria-label={t('table.viewDetails', { model: model.name || model.id })}
                              className="focus-visible:ring-ring/50 truncate rounded-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
                            >
                              {model.name || model.id}
                            </button>
                            <ModelBadges
                              pricing={pricing}
                              isNew={isNew}
                              status={model.status}
                              providerCurrency={providerCurrency}
                            />
                          </div>
                          <div className="text-muted-foreground truncate font-mono text-xs">
                            {model.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(NUMERIC_CELL, 'text-muted-foreground whitespace-nowrap')}
                    >
                      {model.release_date ? formatDate(model.release_date, locale) : '—'}
                    </TableCell>
                    <TableCell className={cn(NUMERIC_CELL, 'text-muted-foreground')}>
                      {formatContext(model.limit?.context)}
                    </TableCell>
                    <TableCell className={NUMERIC_CELL}>
                      <PriceValue pricing={pricing} column="input" />
                    </TableCell>
                    <TableCell className={cn(NUMERIC_CELL, 'text-muted-foreground')}>
                      <PriceValue pricing={pricing} column="cacheRead" />
                    </TableCell>
                    <TableCell className={cn(NUMERIC_CELL, 'text-muted-foreground')}>
                      <PriceValue pricing={pricing} column="cacheWrite" />
                    </TableCell>
                    <TableCell className={NUMERIC_CELL}>
                      <PriceValue pricing={pricing} column="output" />
                    </TableCell>
                  </TableRow>

                  {open && (
                    <>
                      <DetailPricingRows
                        pricing={pricing}
                        withBaseRow={false}
                        isLast={!expr && pricing.alternates.length === 0}
                      />
                      {pricing.alternates.map((alt, index) => (
                        <Fragment key={alt.currency}>
                          <DetailSectionHeader
                            title={t('detail.priceList', { currency: alt.currency })}
                          />
                          <DetailPricingRows
                            pricing={alt}
                            withBaseRow
                            isLast={!expr && index === pricing.alternates.length - 1}
                          />
                        </Fragment>
                      ))}
                      {expr && <DetailExprRow expr={expr} primaryCurrency={pricing.currency} />}
                    </>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
