import { CopyButton } from '@/components/copy-button';
import { useI18n } from '@/lib/i18n';
import { quotaUsdDisplay, useNewApi, type ModelExpr } from '@/lib/newapi';
import { cn } from '@/lib/utils';

/**
 * new-api 计费表达式块（表格展开行与详情页共用）：标题 + 复制 + 系数单位说明 + 表达式。
 * 说明行指出系数所在的 quota-USD 平面在当前部署上显示为多少展示货币，
 * 以及是否采用了主价目之外的官方价目（如 DeepSeek 的人民币价目）。
 */
export function ExprBlock({
  expr,
  primaryCurrency,
  className,
  codeClassName,
}: {
  expr: ModelExpr;
  /** 模型主价目货币，用于提示表达式改用了其他货币的官方价目 */
  primaryCurrency: string;
  className?: string;
  codeClassName?: string;
}) {
  const { t } = useI18n();
  const { deployment } = useNewApi();
  return (
    <div className={className}>
      <div className="text-muted-foreground mb-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px]">
        <span className="font-medium tracking-wider uppercase">{t('table.expr')}</span>
        <CopyButton text={expr.expr} />
        <span>· {t('expr.unit', { display: quotaUsdDisplay(deployment) })}</span>
        {expr.sheetCurrency !== primaryCurrency && (
          <span>· {t('expr.sheet', { currency: expr.sheetCurrency })}</span>
        )}
      </div>
      <code
        className={cn(
          'text-muted-foreground block rounded-md border px-2.5 py-2 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap',
          codeClassName,
        )}
      >
        {expr.expr}
      </code>
    </div>
  );
}
