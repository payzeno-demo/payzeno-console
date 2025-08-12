/**
 * `useBalance(currency)` — `GET /v1/balance` (api-surface.md §12).
 *
 * Returns a `BalanceView`: the contract type plus the two things every consumer derives
 * anyway — a bucket index and whether the merchant is in debit.
 *
 * `negative_balance_minor > 0` means the merchant owes Payzeno money. That is a credit-loss
 * event for an acquirer, not a display detail, so it gets its own flag rather than being left
 * for each caller to notice.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { AccountType, Balance, BalanceBucket, CurrencyCode } from '@payzeno/contracts';

import { BalanceEndpoint } from '@api/endpoints/balance.endpoint';
import { useEndpoints } from '@app/ApiContext';
import type { BalanceView } from '@/types/view-models';

import { balanceQuery } from './balance.queries';

export interface UseBalanceResult {
  balance: BalanceView | undefined;
  hasNegative: boolean;
  totalHeldMinor: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function toBalanceView(balance: Balance): BalanceView {
  const byType = new Map<AccountType, BalanceBucket>();
  for (const bucket of balance.buckets) byType.set(bucket.type, bucket);

  return {
    ...balance,
    _hasNegative: BalanceEndpoint.isNegative(balance),
    _byType: byType,
  };
}

export function useBalance(currency: CurrencyCode): UseBalanceResult {
  const endpoints = useEndpoints();
  const query = useQuery(balanceQuery(endpoints, currency));

  const balance = useMemo(
    () => (query.data ? toBalanceView(query.data) : undefined),
    [query.data],
  );

  return {
    balance,
    hasNegative: balance?._hasNegative ?? false,
    totalHeldMinor: query.data ? BalanceEndpoint.totalHeldMinor(query.data) : 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}
