/**
 * `usePrices()` — `GET /v1/prices` (RFC platform-v2 §6).
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Price } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { PriceRow } from '@/types/view-models';

import { cadenceLabel } from './billing.format';
import { pricesListQuery } from './billing.queries';

export interface UsePricesResult {
  rows: PriceRow[];
  /** `price_id` → price, for the subscription tables. */
  byId: ReadonlyMap<string, Price>;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export function usePrices(): UsePricesResult {
  const endpoints = useEndpoints();
  const query = useQuery(pricesListQuery(endpoints));

  const rows = useMemo(
    () =>
      (query.data?.data ?? []).map((price) => ({
        ...price,
        _selected: false,
        _cadence: cadenceLabel(price.recurring),
      })),
    [query.data],
  );

  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row] as const)), [rows]);

  return {
    rows,
    byId,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
  };
}
