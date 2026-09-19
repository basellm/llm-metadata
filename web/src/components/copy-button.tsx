import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const ICON_ONLY =
  'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex size-6 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none';
const PILL =
  'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none';

/**
 * 复制按钮：成功后短暂显示对勾。无 label 时为图标按钮；有 label 时为带文字的胶囊按钮。
 * `text` 可为惰性函数，避免为未点击的复制预先序列化大载荷。
 */
export function CopyButton({
  text,
  label,
  className,
}: {
  text: string | (() => string);
  label?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(typeof text === 'function' ? text() : text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用（非安全上下文）时静默失败
    }
  };

  const icon = copied ? (
    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
  ) : (
    <Copy className="size-3.5" />
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? t('copy.copied') : (label ?? t('copy.copy'))}
      className={cn(label ? PILL : ICON_ONLY, className)}
    >
      {icon}
      {label && (copied ? t('copy.copied') : label)}
    </button>
  );
}
