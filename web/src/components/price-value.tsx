import { priceCellLabel, type ModelPricing, type PriceColumn } from '@/lib/pricing';
import { cn } from '@/lib/utils';

/**
 * 价格单元格：主价目值，下方以弱化小字列出同一端点其他货币的官方价目（如 DeepSeek 的 ¥ 价）。
 * 表格与卡片视图共用；其他货币在该列无价时不占位。
 */
export function PriceValue({
  pricing,
  column,
  className,
}: {
  pricing: ModelPricing;
  column: PriceColumn;
  className?: string;
}) {
  const alternates = pricing.alternates.filter((alt) => alt.base[column] !== null);
  return (
    <span className={cn('inline-flex flex-col items-end leading-tight', className)}>
      <span>{priceCellLabel(pricing, column)}</span>
      {alternates.map((alt) => (
        <span
          key={alt.currency}
          className="text-muted-foreground/70 text-[11px]"
          title={alt.currency}
        >
          {priceCellLabel(alt, column)}
        </span>
      ))}
    </span>
  );
}
