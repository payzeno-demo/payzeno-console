/**
 * `useDispute(id)` — `GET /v1/disputes/:disputeId`.
 *
 * Two derived facts drive the whole detail page:
 *  - `canSubmitEvidence` — the window is open and the status still accepts a packet.
 *  - `liabilityShifted`  — when the charge carried a successful 3DS authentication and the
 *    reason is `fraudulent`, the issuer eats the loss. Gathering evidence for one of those is
 *    wasted effort, and the page says so rather than letting the merchant spend an afternoon
 *    on it.
 */
import { useQuery } from '@tanstack/react-query';

import type { Dispute } from '@payzeno/contracts';

import { NotFoundApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { disputeQuery } from './disputes.queries';
import { hoursUntil } from './useDisputes';

export interface UseDisputeResult {
  dispute: Dispute | undefined;
  hoursRemaining: number | null;
  windowClosed: boolean;
  canSubmitEvidence: boolean;
  liabilityShifted: boolean;
  isLoading: boolean;
  isMissing: boolean;
  error: Error | null;
  refetch: () => void;
}

const RESPONDABLE_STATUSES = new Set(['needs_response', 'warning_needs_response']);

export function useDispute(disputeId: string): UseDisputeResult {
  const endpoints = useEndpoints();
  const query = useQuery(disputeQuery(endpoints, disputeId));

  const dispute = query.data;
  const isMissing = query.error instanceof NotFoundApiError;
  const hoursRemaining = dispute ? hoursUntil(dispute.evidence_due_by) : null;
  const windowClosed = hoursRemaining !== null && hoursRemaining <= 0;

  return {
    dispute,
    hoursRemaining,
    windowClosed,
    canSubmitEvidence:
      dispute !== undefined && RESPONDABLE_STATUSES.has(dispute.status) && !windowClosed,
    liabilityShifted:
      dispute !== undefined && dispute.liability_shifted && dispute.reason === 'fraudulent',
    isLoading: query.isLoading,
    isMissing,
    error: isMissing ? null : ((query.error as Error | null) ?? null),
    refetch: () => {
      void query.refetch();
    },
  };
}
