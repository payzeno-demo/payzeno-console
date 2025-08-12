/**
 * `usePayout(id)` — `GET /v1/payouts/:payoutId`.
 *
 * `reversal_transaction_id` is the field to look at on a failed payout. The ledger posts a
 * `payout_reversal` when a payout fails or is returned; without it the money is stuck in
 * `payout_clearing` and the merchant's available balance is permanently short. If a failed
 * payout has no reversal, that is an incident, not a display state — so the hook exposes it
 * rather than burying it in the detail card.
 */
import { useQuery } from '@tanstack/react-query';

import type { Payout } from '@payzeno/contracts';

import { NotFoundApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { payoutQuery } from './payouts.queries';

export interface UsePayoutResult {
  payout: Payout | undefined;
  isCancelable: boolean;
  isFailed: boolean;
  /** Failed or returned, but the ledger has posted no reversal. Support needs to know. */
  awaitingReversal: boolean;
  isLoading: boolean;
  isMissing: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePayout(payoutId: string): UsePayoutResult {
  const endpoints = useEndpoints();
  const query = useQuery(payoutQuery(endpoints, payoutId));

  const payout = query.data;
  const isMissing = query.error instanceof NotFoundApiError;
  const isFailed = payout?.status === 'failed' || payout?.status === 'returned';

  return {
    payout,
    isCancelable: payout?.status === 'scheduled',
    isFailed,
    awaitingReversal: isFailed && payout?.reversal_transaction_id === null,
    isLoading: query.isLoading,
    isMissing,
    error: isMissing ? null : ((query.error as Error | null) ?? null),
    refetch: () => {
      void query.refetch();
    },
  };
}
