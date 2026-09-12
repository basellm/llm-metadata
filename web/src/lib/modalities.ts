/** 模态元数据（详情页与卡片视图共用） */

import { AudioLines, Image as ImageIcon, Type, Video, type LucideIcon } from 'lucide-react';

import type { MessageKey, Translator } from './i18n';

export const CORE_MODALITIES = ['text', 'image', 'audio', 'video'] as const;

export const MODALITY_META: Record<string, { icon: LucideIcon; labelKey: MessageKey }> = {
  text: { icon: Type, labelKey: 'pricing.text' },
  image: { icon: ImageIcon, labelKey: 'detail.image' },
  audio: { icon: AudioLines, labelKey: 'pricing.audio' },
  video: { icon: Video, labelKey: 'detail.video' },
};

export function modalityLabel(value: string, t: Translator): string {
  const meta = MODALITY_META[value];
  if (meta) return t(meta.labelKey);
  return value.length <= 3 ? value.toUpperCase() : value.charAt(0).toUpperCase() + value.slice(1);
}
