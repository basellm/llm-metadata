import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { ProviderIcon } from '@/components/provider-icon';
import { Input } from '@/components/ui/input';
import type { ProviderIndexItem } from '@/lib/api';
import { cn } from '@/lib/utils';

export function ProviderSidebar({
  providers,
  selectedId,
  onSelect,
}: {
  providers: ProviderIndexItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return providers;
    return providers.filter(
      (p) => p.id.toLowerCase().includes(normalized) || p.name.toLowerCase().includes(normalized),
    );
  }, [providers, query]);

  return (
    <aside className="hidden w-60 min-h-0 shrink-0 flex-col gap-3 md:flex">
      <div className="relative shrink-0">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter providers…"
          className="pl-8"
          aria-label="Filter providers"
        />
      </div>
      <div className="text-muted-foreground shrink-0 px-2 text-[11px] font-medium tracking-wider uppercase">
        Providers
      </div>
      <nav aria-label="Providers" className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-4">
        <ul className="flex flex-col gap-px">
          {filtered.map((provider) => {
            const active = provider.id === selectedId;
            return (
              <li key={provider.id}>
                <button
                  type="button"
                  onClick={() => onSelect(provider.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    active ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground',
                  )}
                >
                  <ProviderIcon name={provider.name} iconURL={provider.iconURL} />
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
          {filtered.length === 0 && (
            <li className="text-muted-foreground px-2 py-4 text-center text-sm">No providers.</li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
