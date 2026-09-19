import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';

import { cn } from '@/lib/utils';

/**
 * Magic UI `NumberTicker`：进入视口后以弹簧曲线滚动到目标值。
 * 相对上游：增加 `locale` 以按界面语言做千分位格式化，并移除硬编码的黑白文字色（继承父级）。
 */
interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number;
  startValue?: number;
  direction?: 'up' | 'down';
  delay?: number;
  decimalPlaces?: number;
  /** Intl 语言标签（如 "zh-CN"） */
  locale?: string;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  locale = 'en-US',
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : startValue);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => {
      motionValue.set(direction === 'down' ? startValue : value);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [motionValue, isInView, delay, value, direction, startValue]);

  // 语言切换时立即按新格式重写当前值，而不必等下一次弹簧更新
  useEffect(() => {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
    const render = (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatter.format(Number(latest.toFixed(decimalPlaces)));
      }
    };
    render(springValue.get());
    return springValue.on('change', render);
  }, [springValue, decimalPlaces, locale]);

  return (
    <span ref={ref} className={cn('inline-block tabular-nums', className)} {...props}>
      {startValue}
    </span>
  );
}
