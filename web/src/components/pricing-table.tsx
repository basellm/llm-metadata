import { Fragment, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Brain,
  ChevronRight,
  Layers,
  SearchX,
} from 'lucide-react';

import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Model } from '@/lib/api';
import { formatContext, formatTokenPrice } from '@/lib/format';
import { parseModelPricing, type DetailRow, type ModelPricing } from '@/lib/pricing';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'input' | 'output';

interface Row {
  model: Model;
  pricing: ModelPricing;
  expr: string | undefined;
  expandable: boolean;
}

const NUMERIC_CELL = 'text-right font-mono text-[13px] tabular-nums';
/** 明细子行首格：连续左引导线（单元格无内边距，由内层容器撑起整高） */
const GUIDE = 'ml-[26px] border-l pl-4';
const DETAIL_ROW = 'border-0 bg-muted/20 hover:bg-muted/20';

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
  direction: 1 | -1;
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

/** 明细子行：标签 + 与主表对齐的四个价格列 */
function DetailPriceRow({
  row,
  symbol,
  isLast,
}: {
  row: DetailRow;
  symbol: string;
  isLast: boolean;
}) {
  const cell = (value: number | null) => (
    <span className={value === null ? 'text-muted-foreground/40' : 'text-muted-foreground'}>
      {formatTokenPrice(symbol, value)}
    </span>
  );
  return (
    <TableRow className={cn(DETAIL_ROW, isLast && 'border-b')}>
      <TableCell className="p-0 pl-3">
        <div className={cn(GUIDE, 'py-2 text-[13px]')}>{row.label}</div>
      </TableCell>
      <TableCell />
      <TableCell className={NUMERIC_CELL}>{cell(row.input)}</TableCell>
      <TableCell className={NUMERIC_CELL}>{cell(row.cacheRead)}</TableCell>
      <TableCell className={NUMERIC_CELL}>{cell(row.cacheWrite)}</TableCell>
      <TableCell className={NUMERIC_CELL}>{cell(row.output)}</TableCell>
    </TableRow>
  );
}

function DetailSectionHeader({ title }: { title: string }) {
  return (
    <TableRow className={DETAIL_ROW}>
      <TableCell colSpan={6} className="p-0 pl-3">
        <div
          className={cn(
            GUIDE,
            'text-muted-foreground pt-3 pb-1 text-[11px] font-medium tracking-wider uppercase',
          )}
        >
          {title}
        </div>
      </TableCell>
    </TableRow>
  );
}

/** new-api 表达式计费子行（可复制，恒为展开块末行） */
function DetailExprRow({ expr }: { expr: string }) {
  return (
    <TableRow className={cn(DETAIL_ROW, 'border-b')}>
      <TableCell colSpan={6} className="p-0 pl-3">
        <div className={cn(GUIDE, 'py-2 pr-3')}>
          <div className="text-muted-foreground mb-1.5 flex items-center gap-1 text-[11px] font-medium tracking-wider uppercase">
            new-api billing expression
            <CopyButton text={expr} />
          </div>
          <code className="bg-background/60 text-muted-foreground block rounded-md border px-2.5 py-2 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
            {expr}
          </code>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function PricingTable({
  models,
  query,
  billingExpr,
}: {
  models: Model[];
  query: string;
  billingExpr: Record<string, string> | null;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const rows = useMemo<Row[]>(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = models.filter(
      (model) =>
        !normalized ||
        model.id.toLowerCase().includes(normalized) ||
        (model.name || '').toLowerCase().includes(normalized),
    );

    const list = filtered.map((model) => {
      const pricing = parseModelPricing(model.cost);
      const expr = billingExpr?.[model.id];
      return { model, pricing, expr, expandable: pricing.sections.length > 0 || !!expr };
    });
    list.sort((a, b) => {
      if (sortKey === 'name') {
        return direction * a.model.id.localeCompare(b.model.id);
      }
      const av = a.pricing.base[sortKey];
      const bv = b.pricing.base[sortKey];
      // 无价格的行始终排在末尾
      if (av === null && bv === null) return a.model.id.localeCompare(b.model.id);
      if (av === null) return 1;
      if (bv === null) return -1;
      return direction * (av - bv) || a.model.id.localeCompare(b.model.id);
    });
    return list;
  }, [models, query, sortKey, direction, billingExpr]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setDirection(1);
    }
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground flex h-44 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm">
        <SearchX className="size-5 opacity-60" />
        No models match your search.
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1">
      {/* 表格独立纵向滚动，表头吸顶；横向滚动同容器承载 */}
      <div className="max-h-full overflow-auto overscroll-contain rounded-lg border">
        <Table>
          <TableHeader className="bg-card sticky top-0 z-10 shadow-[inset_0_-1px_0_0_var(--border)] [&_tr]:border-0">
            <TableRow className="bg-card hover:bg-card">
              <SortableHead
                label="Model"
                sortKey="name"
                activeKey={sortKey}
                direction={direction}
                onSort={handleSort}
              />
              <TableHead className="text-right">Context</TableHead>
              <SortableHead
                label="Input"
                sortKey="input"
                activeKey={sortKey}
                direction={direction}
                onSort={handleSort}
                className="text-right [&>button]:flex-row-reverse"
              />
              <TableHead className="text-right">Cache read</TableHead>
              <TableHead className="text-right">Cache write</TableHead>
              <SortableHead
                label="Output"
                sortKey="output"
                activeKey={sortKey}
                direction={direction}
                onSort={handleSort}
                className="text-right [&>button]:flex-row-reverse"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ model, pricing, expr, expandable }) => {
              const open = expandable && expanded.has(model.id);
              return (
                <Fragment key={model.id}>
                  <TableRow
                    onClick={expandable ? () => toggle(model.id) : undefined}
                    data-state={open ? 'open' : undefined}
                    className={cn(expandable && 'cursor-pointer', open && 'bg-muted/20 border-0')}
                  >
                    <TableCell className="max-w-80">
                      <div className="flex items-center gap-1.5">
                        {expandable ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggle(model.id);
                            }}
                            aria-expanded={open}
                            aria-label={`${open ? 'Collapse' : 'Expand'} pricing details for ${model.name || model.id}`}
                            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -ml-1 flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          >
                            <ChevronRight
                              className={cn(
                                'size-3.5 transition-transform duration-200',
                                open && 'rotate-90',
                              )}
                            />
                          </button>
                        ) : (
                          <span aria-hidden className="-ml-1 size-5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{model.name || model.id}</span>
                            {pricing.tiered && (
                              <Badge>
                                <Layers />
                                Tiered
                              </Badge>
                            )}
                            {pricing.thinking && (
                              <Badge variant="secondary">
                                <Brain />
                                Thinking
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground truncate font-mono text-xs">
                            {model.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={cn(NUMERIC_CELL, 'text-muted-foreground')}>
                      {formatContext(model.limit?.context)}
                    </TableCell>
                    <TableCell className={NUMERIC_CELL}>
                      {pricing.base.input === null && pricing.unit
                        ? pricing.unit
                        : formatTokenPrice(pricing.symbol, pricing.base.input)}
                    </TableCell>
                    <TableCell className={cn(NUMERIC_CELL, 'text-muted-foreground')}>
                      {formatTokenPrice(pricing.symbol, pricing.base.cacheRead)}
                    </TableCell>
                    <TableCell className={cn(NUMERIC_CELL, 'text-muted-foreground')}>
                      {formatTokenPrice(pricing.symbol, pricing.base.cacheWrite)}
                    </TableCell>
                    <TableCell className={NUMERIC_CELL}>
                      {formatTokenPrice(pricing.symbol, pricing.base.output)}
                    </TableCell>
                  </TableRow>

                  {open && (
                    <>
                      {pricing.sections.map((section) => (
                        <Fragment key={section.title}>
                          <DetailSectionHeader title={section.title} />
                          {section.rows.map((row, index) => (
                            <DetailPriceRow
                              key={row.label}
                              row={row}
                              symbol={pricing.symbol}
                              isLast={
                                !expr &&
                                section === pricing.sections[pricing.sections.length - 1] &&
                                index === section.rows.length - 1
                              }
                            />
                          ))}
                        </Fragment>
                      ))}
                      {expr && <DetailExprRow expr={expr} />}
                    </>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
