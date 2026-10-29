/**
 * `useAcceptDispute()` — `POST /v1/disputes/:id/accept`, staff `risk`.
 *
 * Accepting concedes the chargeback on the merchant's behalf: the dispute goes to `lost` and
 * the amount plus the dispute fee stay with the cardholder. Only legal from `needs_response`.
 */
import { useMoneyFormat } from '@hooks/useMoneyFormat';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import { useAdminEndpoints } from '../../app/AdminApiContext';
import { useStaffAction } from '../../hooks/useStaffAction';
import type { StaffActionResult } from '../../hooks/useStaffAction';

import { acceptDisputeMutation } from './disputes.queries';
import type { AcceptDisputeInput } from './disputes.queries';

export function useAcceptDispute(): StaffActionResult<AcceptDisputeInput> {
  const endpoints = useAdminEndpoints();
  const money = useMoneyFormat();

  return useStaffAction({
    ...acceptDisputeMutation(endpoints),
    invalidate: () => [adminQueryKeys.disputes.all],
    success: (dispute) => ({
      tone: 'info',
      title: `Dispute accepted: ${dispute.id}`,
      body: `Conceded on behalf of ${dispute.merchant_id}. The dispute is now ${dispute.status}; ${money.formatMinor(dispute.amount_minor, dispute.currency)} stays with the cardholder.`,
    }),
    forbidden: 'accepting a dispute needs the risk role.',
    conflict: 'This dispute is no longer waiting for a response.',
  });
}
