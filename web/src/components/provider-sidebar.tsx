import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { ProviderIcon } from '@/components/provider-icon';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchModelIndex, type ModelIndexItem, type ProviderIndexItem } from '@/lib/api';
import { useI18n, type Locale } from '@/lib/i18n';
import { matchRank, matchesQuery, normalizeQuery } from '@/lib/search';
import { cn } from '@/lib/utils';

/** 侧栏最多展示的模型命中数，超出提示缩小范围 */
const MAX_MODEL_RESULTS = 50;

const ITEM_BUTTON =
  'hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none';
const HINT = 'text-muted-foreground px-2 py-4 text-center text-sm';

type ModelIndexState =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'ready'; models: ModelIndexItem[] };

/** 全局模型索引：仅在 locale 非空（用户开始搜索）时加载；`attempt` 变化触发重试 */
function useModelIndex(locale: Locale | null, attempt: number): ModelIndexState {
  const [state, setState] = useState<ModelIndexState>({ status: 'idle' });

  useEffect(() => {
    if (!locale) return;
    let cancelled = false;
    setState({ status: 'loading' });
    fetchModelIndex(locale).then(
      (models) => {
        if (!cancelled) setState({ status: 'ready', models });
      },
      () => {
        if (!cancelled) setState({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [locale, attempt]);

  return state;
}

function SectionLabel({ title, count }: { title: string; count?: number }) {
  return (
    <div className="text-muted-foreground flex items-center justify-between px-2 pb-2 text-[11px] font-medium tracking-wider uppercase">
      {title}
      {count !== undefined && <span className="font-mono tabular-nums">{count}</span>}
    </div>
  );
}

export function ProviderSidebar({
  providers,
  selectedId,
  onSelect,
  onSelectModel,
}: {
  providers: ProviderIndexItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSelectModel: (providerId: string, modelId: string) => void;
}) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);

  const normalized = normalizeQuery(query);
  const searching = normalized.length > 0;
  const index = useModelIndex(searching ? locale : null, attempt);

  const filteredProviders = useMemo(
    () => providers.filter((p) => matchesQuery(p, normalized)),
    [providers, normalized],
  );

  const providerById = useMemo(() => new Map(providers.map((p) => [p.id, p])), [providers]);

  // 模型命中：仅保留所属供应商仍在索引内的项，前缀命中优先（稳定排序保留索引原有顺序）
  const modelResults = useMemo(() => {
    if (!searching || index.status !== 'ready') return [];
    return index.models
      .flatMap((model) => {
        const provider = providerById.get(model.providerId);
        return provider && matchesQuery(model, normalized)
          ? [{ model, provider, rank: matchRank(model, normalized) }]
          : [];
      })
      .sort((a, b) => a.rank - b.rank);
  }, [searching, index, providerById, normalized]);

  const visibleModels = modelResults.slice(0, MAX_MODEL_RESULTS);
  const hiddenCount = modelResults.length - visibleModels.length;

  return (
    <aside className="hidden w-60 min-h-0 shrink-0 flex-col gap-3 md:flex">
      <div className="relative shrink-0">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('sidebar.filter')}
          className="pl-8"
          aria-label={t('sidebar.filter')}
        />
      </div>
      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-4">
        <nav aria-label={t('sidebar.title')}>
          <SectionLabel
            title={t('sidebar.title')}
            count={searching ? filteredProviders.length : undefined}
          />
          <ul className="flex flex-col gap-px">
            {filteredProviders.map((provider) => {
              const active = provider.id === selectedId;
              return (
                <li key={provider.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(provider.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      ITEM_BUTTON,
                      active ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground',
                    )}
                  >
                    <ProviderIcon
                      id={provider.id}
                      name={provider.name}
                      iconURL={provider.iconURL}
                    />
                    <span className="min-w-0 flex-1 truncate">{provider.name}</span>
                    <span
                      className={cn(
                        'font-mono text-[11px] tabular-nums',
                        active ? 'text-muted-foreground' : 'text-muted-foreground/60',
                      )}
                    >
                      {provider.modelCount}
                    </span>
                  </button>
                </li>
              );
            })}
            {filteredProviders.length === 0 && <li className={HINT}>{t('sidebar.empty')}</li>}
          </ul>
        </nav>

        {searching && (
          <nav aria-label={t('sidebar.models')}>
            <SectionLabel
              title={t('sidebar.models')}
              count={index.status === 'ready' ? modelResults.length : undefined}
            />
            {index.status === 'error' ? (
              <div className={cn(HINT, 'flex flex-col items-center gap-2')}>
                {t('sidebar.modelsError')}
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="border-input hover:bg-accent focus-visible:ring-ring/50 rounded-md border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {t('app.retry')}
                </button>
              </div>
            ) : index.status !== 'ready' ? (
              <div className="flex flex-col gap-1 px-2" aria-busy>
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-px">
                {visibleModels.map(({ model, provider }) => (
                  <li key={`${provider.id}/${model.id}`}>
                    <button
                      type="button"
                      onClick={() => onSelectModel(provider.id, model.id)}
                      className={cn(ITEM_BUTTON, 'text-muted-foreground')}
                    >
                      <ProviderIcon
                        id={provider.id}
                        name={provider.name}
                        iconURL={provider.iconURL}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground block truncate">{model.name}</span>
                        <span className="block truncate font-mono text-[11px]">
                          {provider.name} · {model.id}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {modelResults.length === 0 && <li className={HINT}>{t('table.empty')}</li>}
                {hiddenCount > 0 && (
                  <li className="text-muted-foreground px-2 py-2 text-center text-[11px]">
                    {t('sidebar.moreResults', { count: hiddenCount })}
                  </li>
                )}
              </ul>
            )}
          </nav>
        )}
      </div>
    </aside>
  );
}
