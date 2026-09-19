import type { ComponentPropsWithoutRef, CSSProperties } from 'react';

import { cn } from '@/lib/utils';

/**
 * Magic UI `AnimatedShinyText`：文字上周期性掠过的高光。
 * 相对上游：颜色改用主题令牌，在系统开启“减少动态效果”时停止动画，
 * 并移除上游一条非法（带 infinite 的 transition）而被浏览器整体丢弃的声明。
 */
export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<'span'> {
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
  ...props
}: AnimatedShinyTextProps) {
  return (
    <span
      style={{ '--shiny-width': `${shimmerWidth}px` } as CSSProperties}
      className={cn(
        // 文字半透明，让裁切到文字上的高光渐变透出
        'text-muted-foreground/70',
        // 高光扫过效果
        'animate-shiny-text motion-reduce:animate-none bg-size-[var(--shiny-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat',
        // 高光渐变
        'bg-linear-to-r from-transparent via-foreground/80 via-50% to-transparent',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
