import { useEffect } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  AudioLines,
  Braces,
  Brain,
  CalendarDays,
  ChevronLeft,
  Diamond,
  FileText,
  GraduationCap,
  History,
  Image as ImageIcon,
  Paperclip,
  Thermometer,
  Type,
  Video,
  Weight,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { CopyButton } from '@/components/copy-button';
import { ProviderIcon } from '@/components/provider-icon';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Model, ProviderIndexItem } from '@/lib/api';
import { formatContext, formatDate, formatMoney, formatNumber, formatTokenPrice } from '@/lib/format';
import { useI18n, type MessageKey, type Translator } from '@/lib/i18n';
import { parseModelPricing, type DetailSection } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const NUMERIC_CELL = 'text-right font-mono text-[13px] tabular-nums';

const CORE_MODALITIES = ['text', 'image', 'audio', 'video'] as const;

const MODALITY_META: Record<string, { icon: LucideIcon; labelKey: MessageKey }> = {
  text: { icon: Type, labelKey: 'pricing.text' },
  image: { icon: ImageIcon, labelKey: 'detail.image' },
  audio: { icon: AudioLines, labelKey: 'pricing.audio' },
  video: { icon: Video, labelKey: 'detail.video' },
};

/** 能力项：字段未定义（未知）时不展示，避免误报“不支持” */
const FEATURES: ReadonlyArray<{
  field: 'reasoning' | 'tool_call' | 'structured_output' | 'attachment' | 'temperature' | 'open_weights';
  icon: LucideIcon;
  labelKey: MessageKey;
}> = [
  { field: 'reasoning', icon: Brain, labelKey: 'detail.reasoning' },
  { field: 'tool_call', icon: Wrench, labelKey: 'detail.toolCall' },
  { field: 'structured_output', icon: Braces, labelKey: 'detail.structuredOutput' },
  { field: 'attachment', icon: Paperclip, labelKey: 'detail.attachment' },
  { field: 'temperature', icon: Thermometer, labelKey: 'detail.temperature' },
  { field: 'open_weights', icon: Weight, labelKey: 'detail.openWeights' },
];

function modalityLabel(value: string, t: Translator): string {
  const meta = MODALITY_META[value];
  if (meta) return t(meta.labelKey);
  return value.length <= 3 ? value.toUpperCase() : value.charAt(0).toUpperCase() + value.slice(1);
}

/** 概览条单元格 */
function StatCell({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-card p-4">
      <div className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
        {label}
      </div>
      <div className="mt-1.5 flex h-6 items-center font-mono text-sm tabular-nums">{value}</div>
      {sub && <div className="text-muted-foreground mt-0.5 text-xs">{sub}</div>}
    </div>
  );
}

/** 概览条内的模态图标行（不支持的置灰） */
function ModalityIcons({ supported }: { supported: ReadonlySet<string> }) {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-2.5">
      {CORE_MODALITIES.map((value) => {
        const { icon: Icon } = MODALITY_META[value];
        const active = supported.has(value);
        return (
          <Icon
            key={value}
            aria-label={modalityLabel(value, t)}
            className={cn('size-4', active ? 'text-foreground' : 'text-muted-foreground/30')}
          />
        );
      })}
    </span>
  );
}

/** 关键参数行（"1,050,000 · 上下文窗口" 式） */
function Fact({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <Icon aria-hidden className="text-muted-foreground size-4 shrink-0" />
      <span className="font-mono tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </li>
  );
}

/** 左标签右内容的分区（OpenAI 式） */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t py-8 md:grid-cols-[200px_minmax(0,1fr)]">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** 支持状态卡片（模态与能力共用） */
function StatusItem({
  icon: Icon,
  label,
  status,
  active,
}: {
  icon: LucideIcon;
  label: string;
  status: string;
  active: boolean;
}) {
  return (
    <div
      className={cn('flex items-center gap-3 rounded-lg border p-3.5', !active && 'opacity-45')}
    >
      <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{label}</div>
        <div className="text-muted-foreground text-xs">{status}</div>
      </div>
    </div>
  );
}

/** 价格明细分组 → 迷你表格 */
function PricingSectionTable({ section, symbol }: { section: DetailSection; symbol: string }) {
  const { t } = useI18n();
  return (
    <div className="mt-4">
      <div className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wider uppercase">
        {section.title}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="[&_tr]:border-b">
            <TableRow className="bg-card hover:bg-card">
              <TableHead />
              <TableHead className="text-right">{t('table.input')}</TableHead>
              <TableHead className="text-right">{t('table.cacheRead')}</TableHead>
              <TableHead className="text-right">{t('table.cacheWrite')}</TableHead>
              <TableHead className="text-right">{t('table.output')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {section.rows.map((row) => (
              <TableRow key={row.label} className="hover:bg-transparent">
                <TableCell className="text-[13px]">{row.label}</TableCell>
                <TableCell className={NUMERIC_CELL}>{formatTokenPrice(symbol, row.input)}</TableCell>
                <TableCell className={cn(NUMERIC_CELL, 'text-muted-foreground')}>
                  {formatTokenPrice(symbol, row.cacheRead)}
                </TableCell>
                <TableCell className={cn(NUMERIC_CELL, 'text-muted-foreground')}>
                  {formatTokenPrice(symbol, row.cacheWrite)}
                </TableCell>
                <TableCell className={NUMERIC_CELL}>{formatTokenPrice(symbol, row.output)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ModelDetail({
  model,
  provider,
  expr,
  onBack,
}: {
  model: Model;
  provider: ProviderIndexItem;
  expr: string | undefined;
  onBack: () => void;
}) {
  const { locale, t } = useI18n();
  const pricing = parseModelPricing(model.cost, t);

  // 详情页设置文档标题，返回列表时还原
  useEffect(() => {
    const previous = document.title;
    document.title = `${model.name || model.id} · ${provider.name} — LLM Metadata`;
    return () => {
      document.title = previous;
    };
  }, [model, provider.name]);

  const inputModalities = new Set(model.modalities?.input ?? []);
  const outputModalities = new Set(model.modalities?.output ?? []);
  const extraModalities = [...new Set([...inputModalities, ...outputModalities])].filter(
    (value) => !(CORE_MODALITIES as readonly string[]).includes(value),
  );

  const features = FEATURES.filter(({ field }) => typeof model[field] === 'boolean');

  const priceValue =
    pricing.base.input === null && pricing.base.output === null
      ? (pricing.unit ?? '—')
      : `${formatTokenPrice(pricing.symbol, pricing.base.input)} · ${formatTokenPrice(pricing.symbol, pricing.base.output)}`;

  const priceCards = (
    [
      { labelKey: 'table.input', value: pricing.base.input },
      { labelKey: 'table.cacheRead', value: pricing.base.cacheRead },
      { labelKey: 'table.cacheWrite', value: pricing.base.cacheWrite },
      { labelKey: 'table.output', value: pricing.base.output },
    ] as const
  ).flatMap((card) => (card.value === null ? [] : [{ labelKey: card.labelKey, value: card.value }]));

  const modalityStatus = (value: string): { text: string; active: boolean } => {
    const input = inputModalities.has(value);
    const output = outputModalities.has(value);
    if (input && output) return { text: t('detail.inputAndOutput'), active: true };
    if (input) return { text: t('detail.inputOnly'), active: true };
    if (output) return { text: t('detail.outputOnly'), active: true };
    return { text: t('detail.notSupported'), active: false };
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -ml-1 inline-flex items-center gap-1 rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <ChevronLeft className="size-4" />
        {t('detail.back')}
      </button>

      {/* 标题区 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ProviderIcon
          id={provider.id}
          name={provider.name}
          iconURL={provider.iconURL}
          className="size-10 rounded-lg"
        />
        <h1 className="text-2xl font-semibold tracking-tight">{model.name || model.id}</h1>
        {pricing.tiered && <Badge>{t('table.tiered')}</Badge>}
        {pricing.thinking && <Badge variant="secondary">{t('table.thinking')}</Badge>}
      </div>
      <div className="mt-2 flex items-center gap-1">
        <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
          {model.id}
        </code>
        <CopyButton text={model.id} />
      </div>

      {/* 概览条 */}
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-(--border) sm:grid-cols-3 lg:grid-cols-5">
        <StatCell
          label={t('detail.price')}
          value={priceValue}
          sub={`${t('table.input')} · ${t('table.output')}`}
        />
        <StatCell
          label={t('table.context')}
          value={formatContext(model.limit?.context)}
          sub={t('detail.tokens')}
        />
        <StatCell
          label={t('detail.maxOutputShort')}
          value={formatContext(model.limit?.output)}
          sub={t('detail.tokens')}
        />
        <StatCell label={t('table.input')} value={<ModalityIcons supported={inputModalities} />} />
        <StatCell
          label={t('table.output')}
          value={<ModalityIcons supported={outputModalities} />}
        />
      </div>

      {/* 描述 + 关键参数 */}
      <section className="grid gap-6 py-8 md:grid-cols-2">
        {model.description && (
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
            {model.description}
          </p>
        )}
        <ul className="flex flex-col gap-2.5">
          {model.limit?.context != null && (
            <Fact
              icon={Diamond}
              value={formatNumber(model.limit.context, locale)}
              label={t('detail.contextWindow')}
            />
          )}
          {model.limit?.input != null && (
            <Fact
              icon={ArrowDownToLine}
              value={formatNumber(model.limit.input, locale)}
              label={t('detail.maxInput')}
            />
          )}
          {model.limit?.output != null && (
            <Fact
              icon={ArrowUpFromLine}
              value={formatNumber(model.limit.output, locale)}
              label={t('detail.maxOutput')}
            />
          )}
          {model.knowledge && (
            <Fact
              icon={GraduationCap}
              value={formatDate(model.knowledge, locale)}
              label={t('detail.knowledge')}
            />
          )}
          {model.release_date && (
            <Fact
              icon={CalendarDays}
              value={formatDate(model.release_date, locale)}
              label={t('detail.release')}
            />
          )}
          {model.last_updated && (
            <Fact
              icon={History}
              value={formatDate(model.last_updated, locale)}
              label={t('detail.updated')}
            />
          )}
        </ul>
      </section>

      {/* 价格 */}
      {(priceCards.length > 0 || pricing.unit || pricing.sections.length > 0 || expr) && (
        <Section title={t('detail.pricing')}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{t('detail.textTokens')}</span>
            <span className="text-muted-foreground text-xs">{t('detail.per1m')}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {priceCards.map((card) => (
              <div key={card.labelKey} className="bg-card rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">{t(card.labelKey)}</div>
                <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
                  {formatMoney(pricing.symbol, card.value)}
                </div>
              </div>
            ))}
            {priceCards.length === 0 && pricing.unit && (
              <div className="bg-card rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">{t('pricing.unitPricing')}</div>
                <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
                  {pricing.unit}
                </div>
              </div>
            )}
          </div>
          {pricing.sections.map((section) => (
            <PricingSectionTable key={section.title} section={section} symbol={pricing.symbol} />
          ))}
          {expr && (
            <div className="mt-4">
              <div className="text-muted-foreground mb-2 flex items-center gap-1 text-[11px] font-medium tracking-wider uppercase">
                {t('table.expr')}
                <CopyButton text={expr} />
              </div>
              <code className="bg-card text-muted-foreground block rounded-lg border px-3 py-2.5 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
                {expr}
              </code>
            </div>
          )}
        </Section>
      )}

      {/* 模态 */}
      <Section title={t('detail.modalities')}>
        <div className="grid gap-3 sm:grid-cols-2">
          {CORE_MODALITIES.map((value) => {
            const { icon } = MODALITY_META[value];
            const status = modalityStatus(value);
            return (
              <StatusItem
                key={value}
                icon={icon}
                label={modalityLabel(value, t)}
                status={status.text}
                active={status.active}
              />
            );
          })}
          {extraModalities.map((value) => {
            const status = modalityStatus(value);
            return (
              <StatusItem
                key={value}
                icon={FileText}
                label={modalityLabel(value, t)}
                status={status.text}
                active={status.active}
              />
            );
          })}
        </div>
      </Section>

      {/* 能力 */}
      {features.length > 0 && (
        <Section title={t('detail.features')}>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map(({ field, icon, labelKey }) => (
              <StatusItem
                key={field}
                icon={icon}
                label={t(labelKey)}
                status={model[field] ? t('detail.supported') : t('detail.notSupported')}
                active={model[field] === true}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
