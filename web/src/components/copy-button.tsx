import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Tailwind v4 的 scale-* 写入 CSS `scale` 属性而非 transform，过渡需列出 scale
const ICON =
  'absolute size-3.5 transition-[opacity,scale] duration-200 motion-reduce:transition-none';

/**
 * 复制按钮：成功后图标以缩放交叉切换为对勾并短暂停留（纯 CSS 过渡，列表中大量实例无运行时开销）。
 * 无 label 时为图标按钮；有 label 时为带文字的胶囊按钮。
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

  const handleCopy = async (event: MouseEvent) => {
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

  return (
    <Button
      type="button"
      variant={label ? 'outline' : 'ghost'}
      size={label ? 'xs' : 'icon-xs'}
      onClick={handleCopy}
      data-copied={copied || undefined}
      aria-label={copied ? t('copy.copied') : (label ?? t('copy.copy'))}
      className={cn(
        'group/copy text-muted-foreground hover:text-foreground',
        label && 'rounded-full px-2.5 font-normal',
        className,
      )}
    >
      <span className="relative flex size-3.5 items-center justify-center">
        <Copy
          className={cn(ICON, 'group-data-copied/copy:scale-50 group-data-copied/copy:opacity-0')}
        />
        <Check
          className={cn(
            ICON,
            'text-success scale-50 opacity-0 group-data-copied/copy:scale-100 group-data-copied/copy:opacity-100',
          )}
        />
      </span>
      {label && (copied ? t('copy.copied') : label)}
    </Button>
  );
}
