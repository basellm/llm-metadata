import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { BlurFade } from '@/components/ui/blur-fade';
import { Ripple } from '@/components/ui/ripple';

/** 列表区占位面板（无匹配 / 加载失败共用）：Ripple 背景 + 图标 + 文案 + 可选操作 */
export function StatePanel({
  icon: Icon,
  message,
  children,
}: {
  icon: LucideIcon;
  message: string;
  children?: ReactNode;
}) {
  return (
    <BlurFade className="relative flex h-44 shrink-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed text-sm">
      <Ripple mainCircleSize={90} mainCircleOpacity={0.14} numCircles={5} />
      <Icon aria-hidden className="text-muted-foreground relative size-5" />
      <p className="text-muted-foreground relative">{message}</p>
      {children}
    </BlurFade>
  );
}
