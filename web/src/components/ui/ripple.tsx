import { memo, type ComponentPropsWithoutRef, type CSSProperties } from 'react';

import { cn } from '@/lib/utils';

/**
 * Magic UI `Ripple`：居中向外扩散的同心圆背景（纯 CSS 动画）。
 * 相对上游：系统开启“减少动态效果”时停止动画。
 */
interface RippleProps extends ComponentPropsWithoutRef<'div'> {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
}

export const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
  ...props
}: RippleProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 mask-[linear-gradient(to_bottom,white,transparent)] select-none',
        className,
      )}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        return (
          <div
            key={i}
            className="animate-ripple bg-foreground/25 absolute rounded-full border shadow-xl motion-reduce:animate-none"
            style={
              {
                '--i': i,
                width: `${size}px`,
                height: `${size}px`,
                opacity: mainCircleOpacity - i * 0.03,
                animationDelay: `${i * 0.06}s`,
                borderStyle: 'solid',
                borderWidth: '1px',
                borderColor: 'var(--foreground)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1)',
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
});
