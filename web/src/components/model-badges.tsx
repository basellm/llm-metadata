import { Brain, Clock, Layers, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { NEW_MODEL_WINDOW_DAYS } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import type { ModelPricing } from '@/lib/pricing';

/** 模型标记徽章：新增 / 阶梯 / 思考 / 分时段（列表、卡片、详情页共用） */
export function ModelBadges({ pricing, isNew }: { pricing: ModelPricing; isNew: boolean }) {
  const { t } = useI18n();
  return (
    <>
      {isNew && (
        <Badge variant="success" title={t('table.newHint', { days: NEW_MODEL_WINDOW_DAYS })}>
          <Sparkles />
          {t('table.new')}
        </Badge>
      )}
      {pricing.tiered && (
        <Badge>
          <Layers />
          {t('table.tiered')}
        </Badge>
      )}
      {pricing.thinking && (
        <Badge variant="secondary">
          <Brain />
          {t('table.thinking')}
        </Badge>
      )}
      {pricing.scheduled && (
        <Badge variant="outline">
          <Clock />
          {t('table.timeBased')}
        </Badge>
      )}
    </>
  );
}
