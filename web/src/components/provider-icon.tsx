import { useState } from 'react';

import { cn } from '@/lib/utils';

/** 供应商图标：SVG 加载失败时回退为首字母徽标 */
export function ProviderIcon({
  name,
  iconURL,
  className,
}: {
  name: string;
  iconURL?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!iconURL || failed) {
    return (
      <span
        aria-hidden
        className={cn(
          'bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-semibold uppercase',
          className,
        )}
      >
        {name.charAt(0)}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-sm bg-white/90 p-0.5',
        className,
      )}
    >
      <img
        src={iconURL}
        alt=""
        loading="lazy"
        className="size-full"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
