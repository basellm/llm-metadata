import { useState } from 'react';

import { providerLogoURL } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * 供应商图标：优先加载同源镜像 logo，失败时回退到远程 iconURL，
 * 再失败（或加载期间）显示首字母徽标，避免第三方主机不可达时出现空白框。
 */
export function ProviderIcon({
  id,
  name,
  iconURL,
  className,
}: {
  id: string;
  name: string;
  iconURL?: string;
  className?: string;
}) {
  const sources = [providerLogoURL(id), ...(iconURL ? [iconURL] : [])];
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const src = sources[sourceIndex];

  return (
    <span
      aria-hidden
      className={cn(
        'relative flex size-5 shrink-0 items-center justify-center rounded-sm',
        className,
      )}
    >
      {!loaded && (
        <span className="bg-muted text-muted-foreground flex size-full items-center justify-center rounded-[inherit] text-[10px] font-semibold uppercase">
          {name.charAt(0)}
        </span>
      )}
      {src && (
        <img
          src={src}
          alt=""
          loading="lazy"
          className={cn(
            'absolute inset-0 size-full rounded-[inherit] bg-white/90 p-0.5',
            !loaded && 'invisible',
          )}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setSourceIndex((index) => index + 1);
          }}
        />
      )}
    </span>
  );
}
