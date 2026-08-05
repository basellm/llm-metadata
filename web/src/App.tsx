import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, TriangleAlert } from 'lucide-react';

import { PricingTable } from '@/components/pricing-table';
import { ProviderIcon } from '@/components/provider-icon';
import { ProviderSidebar } from '@/components/provider-sidebar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchBillingExpr,
  fetchManifest,
  fetchProvider,
  fetchProviders,
  type Model,
  type Provider,
  type ProviderIndexItem,
} from '@/lib/api';
import { formatDate } from '@/lib/format';

const REPO_URL = 'https://github.com/basellm/llm-metadata';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function readProviderFromHash(): string | null {
  const match = /^#p=([^&]+)/.exec(window.location.hash);
  return match ? decodeURIComponent(match[1]) : null;
}

function TableSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
      <div className="bg-card h-9 border-b" />
      <div className="flex flex-col gap-3 p-3">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="ml-auto h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [providers, setProviders] = useState<ProviderIndexItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [billingExpr, setBillingExpr] = useState<Record<string, string> | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelQuery, setModelQuery] = useState('');
  // 重试令牌：selectedId 不变时也能重新触发加载 effect
  const [reloadKey, setReloadKey] = useState(0);

  // 加载供应商索引与构建元信息，并根据 URL hash 恢复选中项
  useEffect(() => {
    let cancelled = false;
    fetchProviders()
      .then(({ providers: list }) => {
        if (cancelled) return;
        const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
        setProviders(sorted);
        const fromHash = readProviderFromHash();
        const initial = sorted.find((p) => p.id === fromHash) ?? sorted[0];
        if (initial) setSelectedId(initial.id);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    fetchManifest().then((manifest) => {
      if (!cancelled && manifest?.generatedAt) setUpdatedAt(manifest.generatedAt);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // 加载选中供应商的模型与表达式计费映射
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setProvider(null);
    setBillingExpr(null);
    setError(null);
    Promise.all([fetchProvider(selectedId), fetchBillingExpr(selectedId)])
      .then(([data, expr]) => {
        if (cancelled) return;
        setProvider(data);
        setBillingExpr(expr);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, reloadKey]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setModelQuery('');
    history.replaceState(null, '', `#p=${encodeURIComponent(id)}`);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const models = useMemo<Model[]>(
    () => (provider ? Object.values(provider.models) : []),
    [provider],
  );

  const totalModels = useMemo(
    () => (providers ?? []).reduce((sum, p) => sum + p.modelCount, 0),
    [providers],
  );

  const selectedMeta = providers?.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4">
          <a
            href="./"
            className="focus-visible:ring-ring/50 flex items-center gap-2 rounded-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
          >
            <span aria-hidden className="bg-primary size-2.5 rounded-full" />
            LLM Metadata
          </a>
          <span className="text-muted-foreground hidden text-sm sm:inline">
            Native provider pricing
          </span>
          <div className="ml-auto flex items-center gap-3">
            {providers && (
              <span className="text-muted-foreground hidden rounded-full border px-2.5 py-0.5 font-mono text-[11px] tabular-nums sm:inline">
                {providers.length} providers · {totalModels} models
              </span>
            )}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <GithubIcon className="size-5" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-6 px-4 pt-6">
        {providers ? (
          <ProviderSidebar providers={providers} selectedId={selectedId} onSelect={handleSelect} />
        ) : (
          <aside className="hidden w-60 shrink-0 flex-col gap-2 md:flex">
            <Skeleton className="h-9 w-full" />
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </aside>
        )}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 pb-6">
          {/* 移动端：供应商选择器 */}
          {providers && selectedId && (
            <div className="shrink-0 md:hidden">
              <Select value={selectedId} onValueChange={handleSelect}>
                <SelectTrigger aria-label="Select provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <ProviderIcon name={p.name} iconURL={p.iconURL} className="size-4" />
                      <span className="truncate">{p.name}</span>
                      <span className="text-muted-foreground font-mono text-xs tabular-nums">
                        {p.modelCount}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedMeta && (
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <ProviderIcon
                name={selectedMeta.name}
                iconURL={selectedMeta.iconURL}
                className="size-8 rounded-md"
              />
              <h1 className="text-xl font-semibold tracking-tight">{selectedMeta.name}</h1>
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[11px]">
                {selectedMeta.id}
              </span>
              {selectedMeta.doc && (
                <a
                  href={selectedMeta.doc}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <BookOpen className="size-3.5" />
                  Docs
                </a>
              )}
              <div className="relative ml-auto w-full sm:w-72">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={modelQuery}
                  onChange={(e) => setModelQuery(e.target.value)}
                  placeholder="Search models…"
                  className="pl-8"
                  aria-label="Search models"
                />
              </div>
            </div>
          )}

          {error ? (
            <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-sm">
              <TriangleAlert className="text-muted-foreground size-5" />
              <p className="text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="border-input hover:bg-accent focus-visible:ring-ring/50 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                Retry
              </button>
            </div>
          ) : provider ? (
            <>
              <PricingTable
                key={provider.id}
                models={models}
                query={modelQuery}
                billingExpr={billingExpr}
              />
              <p className="text-muted-foreground text-xs">
                {models.length} models · Prices per 1M tokens in the provider's billing currency ·
                Expand a row for tier details.
              </p>
            </>
          ) : (
            <TableSkeleton />
          )}

          <footer className="mt-auto shrink-0 border-t pt-4">
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span>
                Data from{' '}
                <a
                  href="https://models.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground underline underline-offset-2"
                >
                  models.dev
                </a>{' '}
                and community overrides · Native providers only
              </span>
              {updatedAt && <span>Updated {formatDate(updatedAt)}</span>}
              <a
                href={`${REPO_URL}#readme`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground ml-auto underline underline-offset-2"
              >
                API documentation
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
