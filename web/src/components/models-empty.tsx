import { SearchX } from 'lucide-react';

import { useI18n } from '@/lib/i18n';

/** 搜索无结果占位（表格与卡片视图共用） */
export function ModelsEmpty() {
  const { t } = useI18n();
  return (
    <div className="text-muted-foreground flex h-44 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm">
      <SearchX className="size-5 opacity-60" />
      {t('table.empty')}
    </div>
  );
}
