/**
 * "Held for review by Payzeno" — the payment detail page's read-only view of an RFC
 * platform-v2 §8 risk review.
 *
 * There is deliberately no button here. A merchant cannot approve or decline a review; the
 * callout says what is happening, why, and what the shopper will experience either way, so the
 * merchant can answer the shopper's email without opening a ticket.
 */
import type { Review } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { Alert } from '@components/ui/Alert';
import { Skeleton } from '@components/ui/Skeleton';
import { formatTimestamp } from '@lib/date';

import { riskRuleLabel } from '../risk';

export interface ReviewCalloutProps {
  review: Review | undefined;
  isLoading: boolean;
  error: Error | null;
}

function Signals({ review }: { review: Review }) {
  return (
    <>
      <p>Why it was held:</p>
      <ul aria-label="Risk rules that matched">
        {review.rules.map((rule) => (
          <li key={rule}>{riskRuleLabel(rule)}</li>
        ))}
      </ul>
      <dl>
        <dt>Risk score</dt>
        <dd>{review.risk_score}</dd>
        <dt>Card country</dt>
        <dd>{review.card_country ?? 'Unknown'}</dd>
        <dt>Shopper location</dt>
        <dd>{review.ip_country ?? 'Unknown'}</dd>
        <dt>Opened</dt>
        <dd>{formatTimestamp(review.opened_at)}</dd>
        {review.closed_at ? (
          <>
            <dt>Decided</dt>
            <dd>{formatTimestamp(review.closed_at)}</dd>
          </>
        ) : null}
      </dl>
    </>
  );
}

export function ReviewCallout({ review, isLoading, error }: ReviewCalloutProps) {
  if (error) {
    return (
      <InlineError id="review-error">
        This payment was held for review, but the review could not be loaded.
      </InlineError>
    );
  }

  if (isLoading || !review) {
    return <Skeleton height="96px" />;
  }

  if (review.status === 'open') {
    return (
      <Alert tone="warning" title="Held for review by Payzeno">
        <p>
          Payzeno&apos;s risk team is checking this payment before it is captured. The card is
          authorised but not charged, and there is nothing for you to do. If it is approved it is
          captured and the shopper gets a receipt; if it is declined the authorisation is released
          and the shopper is never charged.
        </p>
        <Signals review={review} />
      </Alert>
    );
  }

  if (review.status === 'approved') {
    return (
      <Alert tone="success" title="Approved by Payzeno risk">
        <p>This payment was held for review and approved, then captured as normal.</p>
        <Signals review={review} />
      </Alert>
    );
  }

  return (
    <Alert tone="danger" role="status" title="Declined by Payzeno risk">
      <p>
        This payment was held for review and declined as fraudulent. The authorisation was released,
        so the shopper was not charged, and they were told by email.
      </p>
      <Signals review={review} />
    </Alert>
  );
}
