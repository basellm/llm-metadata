import { useRef, type ReactNode } from 'react';
import { motion, useInView, type MotionProps, type UseInViewOptions } from 'motion/react';

/**
 * Magic UI `BlurFade`：模糊 + 位移 + 透明度的渐入容器，可在进入视口时再开始。
 * 相对上游：移除无子节点增删、从不触发的 AnimatePresence/exit 与未使用的 `variant` 覆盖。
 */
interface BlurFadeProps extends MotionProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  /** 起始位移（px） */
  offset?: number;
  /** 进入方向：down 表示自上而下落入 */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** 为 true 时等元素进入视口再开始 */
  inView?: boolean;
  inViewMargin?: UseInViewOptions['margin'];
  blur?: string;
}

export function BlurFade({
  children,
  className,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = 'down',
  inView = false,
  inViewMargin = '-50px',
  blur = '6px',
  ...props
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const from = direction === 'right' || direction === 'down' ? -offset : offset;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: { [axis]: from, opacity: 0, filter: `blur(${blur})` },
        visible: { [axis]: 0, opacity: 1, filter: 'blur(0px)' },
      }}
      transition={{ delay: 0.04 + delay, duration, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
