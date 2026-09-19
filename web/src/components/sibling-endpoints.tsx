import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

import { DetailSection } from '@/components/detail-section';
import { ModelBadges } from '@/components/model-badges';
import { PriceValue } from '@/components/price-value';
import { ProviderIcon } from '@/components/provider-icon';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchModelIndex, fetchProvider, type Model, type ProviderIndexItem } from '@/lib/api';
import { useI18n, type Locale } from '@/lib/i18n';
import { parseModelPricing } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const NUMERIC_CELL = 'text-right font-mono text-[13px] tabular-nums';

interface Sibling {
  provider: ProviderIndexItem;
  model: Model;
}

type SiblingsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; siblings: Sibling[] };

/** 同一模型 ID 在其他已列出原生端点上的条目（地区版本），按供应商名排序 */
function useSiblings(
  modelId: string,
  providerId: string,
  locale: Locale,
  providers: ProviderIndexItem[],
): SiblingsState {
  const [state, setState] = useState<SiblingsState>({ status: 'loading' });
  const providerById = useMemo(() => new Map(providers.map((p) => [p.id, p])), [providers]);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchModelIndex(locale)
      .then((index) => {
        const targets = index
          .filter((item) => item.id === modelId && item.providerId !== providerId)
          .flatMap((item) => {
            const provider = providerById.get(item.providerId);
            return provider ? [provider] : [];
          });
        return Promise.all(
          targets.map(async (provider) => {
            const model = (await fetchProvider(locale, provider.id)).models[modelId];
            return model ? [{ provider, model }] : [];
          }),
        );
      })
      .then((groups) => {
        if (cancelled) return;
        const siblings = groups
          .flat()
          .sort((a, b) => a.provider.name.localeCompare(b.provider.name));
        setState({ status: 'ready', siblings });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [modelId, providerId, locale, providerById]);

  return state;
}

/**
 * “其他端点”分区：同一模型在同一厂商其他端点（国内 / 国际）的官方价格并列对照，
 * 让国内外双定价一目了然。无同名条目时不渲染；未列出的供应商（订阅套餐端点）不参与。
 */
export function SiblingEndpoints({
  modelId,
  providerId,
  providers,
  onOpen,
}: {
  modelId: string;
  providerId: string;
  providers: ProviderIndexItem[];
  onOpen: (providerId: string, modelId: string) => void;
}) {
  const { locale, t } = useI18n();
  const state = useSiblings(modelId, providerId, locale, providers);

  if (state.status === 'loading') return null;
  if (state.status === 'ready' && state.siblings.length === 0) return null;

  return (
    <DetailSection title={t('detail.otherEndpoints')} hint={t('detail.otherEndpointsHint')}>
      {state.status === 'error' ? (
        <p className="text-muted-foreground text-sm">{t('detail.otherEndpointsError')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="[&_tr]:border-b">
              <TableRow className="bg-card hover:bg-card">
                <TableHead>{t('sidebar.title')}</TableHead>
                <TableHead className="text-right">{t('table.input')}</TableHead>
                <TableHead className="text-right">{t('table.cacheRead')}</TableHead>
                <TableHead className="text-right">{t('table.output')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.siblings.map(({ provider, model }) => {
                const pricing = parseModelPricing(model.cost, t, locale, {
                  providerCurrency: provider.currency,
                });
                return (
                  <TableRow
                    key={provider.id}
                    onClick={() => onOpen(provider.id, modelId)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ProviderIcon
                          id={provider.id}
                          name={provider.name}
                          iconURL={provider.iconURL}
                          className="size-6 rounded-sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[13px] font-medium">
                            <span className="truncate">{provider.name}</span>
                            <span className="bg-muted text-muted-foreground rounded px-1.5 py-px font-mono text-[10px]">
                              {pricing.currency}
                            </span>
                            <ModelBadges
                              pricing={pricing}
                              isNew={false}
                              status={model.status}
                              providerCurrency={provider.currency}
                            />
                          </div>
                          <div className="text-muted-foreground truncate font-mono text-[11px]">
                            {provider.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={NUMERIC_CELL}>
                      <PriceValue pricing={pricing} column="input" />
                    </TableCell>
                    <TableCell className={cn(NUMERIC_CELL, 'text-muted-foreground')}>
                      <PriceValue pricing={pricing} column="cacheRead" />
                    </TableCell>
                    <TableCell className={NUMERIC_CELL}>
                      <PriceValue pricing={pricing} column="output" />
                    </TableCell>
                    <TableCell className="w-0 pr-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpen(provider.id, modelId);
                        }}
                        aria-label={t('table.viewDetails', { model: provider.name })}
                        className="size-7"
                      >
                        <ArrowUpRight className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </DetailSection>
  );
}
