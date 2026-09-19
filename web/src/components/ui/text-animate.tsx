import { memo } from 'react';
import { motion, type MotionProps, type Variants } from 'motion/react';

import { cn } from '@/lib/utils';

/**
 * Magic UI `TextAnimate`（blurInUp 预设）：文本按字符或单词逐段模糊上浮揭示。
 * 相对上游：保留本项目使用的接口，去掉从不触发的 exit/AnimatePresence、未使用的预设与自定义
 * variants；字符切分改用 Intl.Segmenter，避免拆散代理对（emoji 等）。
 */
type SplitBy = 'character' | 'word';

const motionElements = {
  h1: motion.h1,
  h2: motion.h2,
  p: motion.p,
  span: motion.span,
} as const;

interface TextAnimateProps extends Omit<MotionProps, 'children'> {
  children: string;
  className?: string;
  segmentClassName?: string;
  /** 整体开始前的延迟（秒） */
  delay?: number;
  /** 全部片段揭示完毕的总时长（秒），按片段数均分为交错间隔 */
  duration?: number;
  as?: keyof typeof motionElements;
  by?: SplitBy;
}

const ITEM: Variants = {
  hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
  show: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { y: { duration: 0.3 }, opacity: { duration: 0.4 }, filter: { duration: 0.3 } },
  },
};

const segmenter =
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

function split(text: string, by: SplitBy): string[] {
  if (by === 'word') return text.split(/(\s+)/).filter(Boolean);
  return segmenter
    ? Array.from(segmenter.segment(text), (segment) => segment.segment)
    : Array.from(text);
}

function TextAnimateBase({
  children,
  delay = 0,
  duration = 0.3,
  className,
  segmentClassName,
  as = 'p',
  by = 'word',
  ...props
}: TextAnimateProps) {
  const MotionComponent = motionElements[as];
  const segments = split(children, by);

  return (
    <MotionComponent
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 1 },
        show: {
          opacity: 1,
          transition: { delayChildren: delay, staggerChildren: duration / segments.length },
        },
      }}
      className={cn('whitespace-pre-wrap', className)}
      aria-label={children}
      {...props}
    >
      {/* 完整文本供读屏软件朗读；逐段动画的片段对辅助技术隐藏 */}
      <span className="sr-only">{children}</span>
      {segments.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          variants={ITEM}
          className={cn('inline-block whitespace-pre', segmentClassName)}
          aria-hidden
        >
          {segment}
        </motion.span>
      ))}
    </MotionComponent>
  );
}

export const TextAnimate = memo(TextAnimateBase);
