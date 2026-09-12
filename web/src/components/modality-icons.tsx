import { useI18n } from '@/lib/i18n';
import { CORE_MODALITIES, MODALITY_META, modalityLabel } from '@/lib/modalities';
import { cn } from '@/lib/utils';

/** 核心模态图标行（不支持的置灰） */
export function ModalityIcons({
  supported,
  className,
}: {
  supported: ReadonlySet<string>;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      {CORE_MODALITIES.map((value) => {
        const { icon: Icon } = MODALITY_META[value];
        const active = supported.has(value);
        return (
          <Icon
            key={value}
            aria-label={modalityLabel(value, t)}
            className={cn(
              'size-4 shrink-0',
              active ? 'text-foreground' : 'text-muted-foreground/30',
            )}
          />
        );
      })}
    </span>
  );
}
