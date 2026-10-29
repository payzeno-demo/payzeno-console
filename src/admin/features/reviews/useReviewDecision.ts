/**
 * `useReviewDecision()` — `POST /v1/admin/reviews/:id/{approve|decline}` (risk).
 *
 * Approve captures the held authorisation; the shopper gets a receipt. Decline voids it and
 * cancels the PaymentIntent as `fraudulent`; the shopper is told and was never charged.
 * Refetches every review list and detail, which is also what drops the home page's count.
 */
import { useMoneyFormat } from '@hooks/useMoneyFormat';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import { useAdminEndpoints } from '../../app/AdminApiContext';
import { useStaffAction } from '../../hooks/useStaffAction';
import type { StaffActionResult } from '../../hooks/useStaffAction';

import { reviewDecisionMutation } from './reviews.queries';
import type { ReviewDecisionInput } from './reviews.queries';

export function useReviewDecision(): StaffActionResult<ReviewDecisionInput> {
  const endpoints = useAdminEndpoints();
  const money = useMoneyFormat();

  return useStaffAction({
    ...reviewDecisionMutation(endpoints),
    invalidate: () => [adminQueryKeys.reviews.all],
    success: (review, vars) => {
      const amount = money.formatMinor(review.amount_minor, review.currency);
      return vars.decision === 'approve'
        ? {
            tone: 'success',
            title: `Payment approved: ${amount}`,
            body: `Review ${review.id} is closed and ${review.payment_intent_id} is being captured. The shopper gets their receipt.`,
          }
        : {
            tone: 'info',
            title: `Payment declined: ${amount}`,
            body: `Review ${review.id} is closed; the authorisation on ${review.payment_intent_id} is voided and the shopper was not charged.`,
          };
    },
    forbidden: 'deciding a risk review needs the risk role.',
    conflict: 'Someone else decided this review first.',
  });
}
