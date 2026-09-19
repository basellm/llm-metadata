import {
  Archive,
  Brain,
  CircleDollarSign,
  Clock,
  FlaskConical,
  Layers,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { NEW_MODEL_WINDOW_DAYS } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import type { ModelPricing } from '@/lib/pricing';

/**
 * 模型标记徽章：生命周期状态 / 新增 / 阶梯 / 思考 / 分时段 / 上游估算价（列表、卡片、详情页共用）。
 * `providerCurrency` 仅用于估算价提示文案。
 */
export function ModelBadges({
  pricing,
  isNew,
  status,
  providerCurrency,
}: {
  pricing: ModelPricing;
  isNew: boolean;
  status?: string | undefined;
  providerCurrency?: string | undefined;
}) {
  const { t } = useI18n();
  return (
    <>
      {status === 'deprecated' && (
        <Badge variant="warning">
          <Archive />
          {t('table.deprecated')}
        </Badge>
      )}
      {status === 'beta' && (
        <Badge variant="secondary">
          <FlaskConical />
          {t('table.beta')}
        </Badge>
      )}
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
      {pricing.estimated && (
        <Badge
          variant="outline"
          title={t('table.estimatedHint', { currency: providerCurrency ?? '' })}
        >
          <CircleDollarSign />
          {t('table.estimated')}
        </Badge>
      )}
    </>
  );
}
