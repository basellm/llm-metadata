import type { CSSProperties, PointerEvent, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Magic UI `MagicCard`（gradient 模式）：边框与内部聚光灯跟随指针的卡片容器。
 * 相对上游精简：移除仅 Next.js 可用的 next-themes 依赖与未使用的 orb 模式；
 * 指针坐标直接写入 CSS 自定义属性由渐变消费，不经 motion 运行时，列表中数十张卡片零额外开销。
 */
export interface MagicCardProps {
  children?: ReactNode;
  className?: string;
  /** 聚光灯直径（px） */
  gradientSize?: number;
  /** 内部聚光灯颜色 */
  gradientColor?: string;
  gradientOpacity?: number;
  /** 边框渐变起止色 */
  gradientFrom?: string;
  gradientTo?: string;
}

const BORDER_GRADIENT =
  '[background:linear-gradient(var(--color-card)_0_0)_padding-box,radial-gradient(var(--magic-size)_circle_at_var(--magic-x)_var(--magic-y),var(--magic-from),var(--magic-to),var(--color-border)_100%)_border-box]';
const SPOTLIGHT_GRADIENT =
  '[background:radial-gradient(var(--magic-size)_circle_at_var(--magic-x)_var(--magic-y),var(--magic-color),transparent_100%)]';

function setPointer(target: HTMLDivElement, x: number, y: number): void {
  target.style.setProperty('--magic-x', `${x}px`);
  target.style.setProperty('--magic-y', `${y}px`);
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = 'var(--color-accent)',
  gradientOpacity = 0.8,
  gradientFrom = 'var(--color-primary)',
  gradientTo = 'var(--color-border)',
}: MagicCardProps) {
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer(event.currentTarget, event.clientX - rect.left, event.clientY - rect.top);
  };

  // 指针离开后把聚光灯移到卡片外，避免残留高光
  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    setPointer(event.currentTarget, -gradientSize, -gradientSize);
  };

  return (
    <div
      className={cn(
        'group relative isolate overflow-hidden rounded-[inherit] border border-transparent',
        BORDER_GRADIENT,
        className,
      )}
      style={
        {
          '--magic-x': `${-gradientSize}px`,
          '--magic-y': `${-gradientSize}px`,
          '--magic-size': `${gradientSize}px`,
          '--magic-from': gradientFrom,
          '--magic-to': gradientTo,
          '--magic-color': gradientColor,
          '--magic-opacity': gradientOpacity,
        } as CSSProperties
      }
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="bg-card absolute inset-px z-20 rounded-[inherit]" />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-px z-30 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-(--magic-opacity)',
          SPOTLIGHT_GRADIENT,
        )}
      />
      <div className="relative z-40">{children}</div>
    </div>
  );
}
