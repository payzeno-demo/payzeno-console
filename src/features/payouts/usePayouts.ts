/**
 * `usePayouts(q)` — `GET /v1/payouts` (api-surface.md §12).
 *
 * `_bankLabel` is resolved here against the merchant's bank accounts rather than on the API:
 * `Payout` carries `bank_account_id` and nothing else, and a table of opaque `ba_…` ids is
 * useless to a finance team with four accounts.
 *
 * The hook also surfaces `failedCount`, which is what `PayoutsPage` renders as the
 * `payout.failed` banner. The push event itself arrives over the notification socket and
 * invalidates `queryKeys.payouts.all`, so this count is what the alert reads after the
 * refetch lands.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

import type { BankAccount, Paginated, Payout } from '@payzeno/contracts';

import type { PayoutListQuery } from '@api/endpoints/payouts.endpoint';
import { useEndpoints } from '@app/ApiContext';
import { usePagination } from '@hooks/usePagination';
import type { Pagination } from '@hooks/usePagination';
import { maskLastFour } from '@lib/format';
import { useBankAccounts } from '@features/settings/useBankAccounts';
import type { PayoutRow } from '@/types/view-models';

import { payoutsListQuery } from './payouts.queries';

export interface UsePayoutsResult {
  rows: PayoutRow[];
  failedCount: number;
  pagination: Pagination;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function bankLabel(account: BankAccount | undefined): string {
  if (!account) return 'Unknown account';
  return `${account.bank_name} ${maskLastFour(account.last_four)}`;
}

export function usePayouts(q?: PayoutListQuery): UsePayoutsResult {
  const endpoints = useEndpoints();
  const { accountsById } = useBankAccounts();

  // See `useRefunds` — the cursor is an input to the request that produces the page.
  const latest = useRef<Paginated<Payout> | undefined>(undefined);
}
