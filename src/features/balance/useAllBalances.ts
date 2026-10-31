/**
 * `useAllBalances()` — `GET /v1/balance` with no `currency` (RFC platform-v2 §7).
 *
 * Balances are per currency, and a merchant taking EUR through adaptive pricing has a EUR
 * balance whether or not they ever opened the EUR tab. The api lists every currency the
 * ledger holds for the merchant in one read; this hook adds the one derived flag the summary
 * needs. It shares `queryKeys.balance.all` with `useBalance`, so a payout's invalidation
 * refreshes both.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { CURRENCIES } from '@payzeno/contracts';
import type { Balance } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import type { CurrencyBalanceRow } from '@/types/view-models';

import { allBalancesQuery } from './balance.queries';

export interface UseAllBalancesResult {
  /** Every currency the api returned, in `CURRENCIES` order. */
  rows: CurrencyBalanceRow[];
  /** The subset with money in it. */
  activeRows: CurrencyBalanceRow[];
  isLoading: boolean;
  error: Error | null;
}

export function hasActivity(balance: Balance): boolean {
  return (
    balance.available_minor !== 0 ||
    balance.pending_minor !== 0 ||
    balance.reserved_minor !== 0 ||
    balance.disputed_minor !== 0 ||
    balance.negative_balance_minor !== 0
  );
}

function order(balance: Balance): number {
  const index = CURRENCIES.indexOf(balance.currency);
  return index === -1 ? CURRENCIES.length : index;
}

export function useAllBalances(): UseAllBalancesResult {
  const endpoints = useEndpoints();
  const query = useQuery(allBalancesQuery(endpoints));

  const rows = useMemo<CurrencyBalanceRow[]>(
    () =>
      // `?? []`: an api build that predates the list answers this route with one `Balance`,
      // which has no `data`. The summary then shows nothing rather than one wrong row.
      [...(query.data?.data ?? [])]
        .sort((a, b) => order(a) - order(b))
        .map((balance) => ({
          ...balance,
          id: balance.currency,
          _hasActivity: hasActivity(balance),
        })),
    [query.data],
  );

  const activeRows = useMemo(() => rows.filter((row) => row._hasActivity), [rows]);

  return {
    rows,
    activeRows,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
