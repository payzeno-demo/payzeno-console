/**
 * `ReviewDetailPage` — `/reviews/:reviewId`.
 *
 * The signals a platform rule fired on, laid out for a decision: amount, acquirer risk score,
 * the rules (with what each one means), shopper country against card country, the merchant and
 * the payment. Approve or decline, each with an optional note that goes on the review.
 */
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { PageContainer, PageSections } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Card, StatCard } from '@components/ui/Card';
import { color, font, space, visuallyHidden } from '@components/ui/tokens';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { assertDefined } from '@lib/assert';

import { ADMIN_ROUTES } from '../../adminRoutes';
import { ACTION_ROLES, describeRequirement } from '../../app/staff-roles';
import { useStaffPermissions } from '../../app/StaffSessionContext';
import { ActionOutcomeAlert } from '../../components/ActionOutcome';
import { AdminQueryError } from '../../components/AdminQueryError';
import { AdminStatusPill } from '../../components/AdminStatusPill';
import { ConfirmActionDialog } from '../../components/ConfirmActionDialog';
import { DetailList } from '../../components/DetailList';

import { countryMismatch, describeCountries, ruleDescription, ruleLabel, scoreBand } from './review-format';
import { useReview } from './useReview';
import { useReviewDecision } from './useReviewDecision';

type Dialog = 'approve' | 'decline' | null;

export function ReviewDetailPage() {
  const reviewId = assertDefined(useParams().reviewId, 'ReviewDetailPage needs :reviewId');
  const { review, isLoading, isFetching, error, refetch } = useReview(reviewId);
  const decision = useReviewDecision();
  const { can } = useStaffPermissions();
  const [dialog, setDialog] = useState<Dialog>(null);

  useDocumentTitle(reviewId, 'Risk reviews', 'Admin');

  const breadcrumbs = [{ label: 'Risk reviews', to: ADMIN_ROUTES.reviews.index }, { label: reviewId }];

  if (isLoading) return <LoadingPage label="Loading review" />;

  if (error || !review) {
    return (
      <PageContainer as="main">
        <PageHeader title="Risk review" breadcrumbs={breadcrumbs} />
        <AdminQueryError error={error} title="We could not load this review" what="risk reviews" onRetry={refetch} />
      </PageContainer>
    );
  }

  const band = scoreBand(review.risk_score);
  const mismatch = countryMismatch(review);
  const canDecide = can('reviews:decide');
  const isOpen = review.status === 'open';
  const disabledReason = !canDecide
    ? `Needs ${describeRequirement(ACTION_ROLES['reviews:decide'])}.`
    : !isOpen
      ? `This review is already ${review.status}.`
      : null;

  const close = () => {
    setDialog(null);
    decision.reset();
  };

  return (
    <PageContainer as="main">
      <PageHeader
        title={`Review ${review.id}`}
        description="A platform rule held this payment for a decision. The authorisation is still open and the shopper has not been charged."
        isBusy={isFetching}
        breadcrumbs={breadcrumbs}
      >
        <AdminStatusPill kind="review" status={review.status} />
      </PageHeader>

      <ActionOutcomeAlert outcome={decision.outcome} onDismiss={decision.clearOutcome} />

      <PageSections>
        <section aria-label="Decision" style={{ display: 'grid', gap: space[2] }}>
          <div style={{ display: 'flex', gap: space[2], flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              disabled={disabledReason !== null}
              aria-describedby={disabledReason ? 'review-decision-reason' : undefined}
              onClick={() => setDialog('approve')}
            >
              Approve payment
            </Button>
            <Button
              variant="danger"
              disabled={disabledReason !== null}
              aria-describedby={disabledReason ? 'review-decision-reason' : undefined}
              onClick={() => setDialog('decline')}
            >
              Decline payment
            </Button>
          </div>
          {disabledReason ? (
            <p id="review-decision-reason" style={{ margin: 0, fontSize: font.size.sm, color: color.textSecondary }}>
              {disabledReason}
            </p>
          ) : null}
        </section>

        <section
          aria-label="Risk signals"
          style={{ display: 'grid', gap: space[4], gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        >
          <StatCard label="Amount" value={<MoneyCell amountMinor={review.amount_minor} currency={review.currency} />} />
          <StatCard
            label="Acquirer risk score"
            value={review.risk_score}
            hint={`${band.label} (0–100)`}
            tone={band.tone === 'danger' ? 'danger' : 'neutral'}
          />
          <StatCard
            label="Shopper country vs card country"
            value={`${review.ip_country ?? '??'} / ${review.card_country ?? '??'}`}
            hint={mismatch === null ? 'Shopper location unknown' : mismatch ? 'Mismatch' : 'Match'}
            tone={mismatch ? 'danger' : 'neutral'}
          />
        </section>

        <Card title="Rules that fired" headingLevel={2}>
          <ul style={{ margin: 0, padding: 0, display: 'grid', gap: space[3], listStyle: 'none' }}>
            {review.rules.map((rule) => (
              <li key={rule} style={{ display: 'grid', gap: space[1] }}>
                <span>
                  <Badge tone="warning" size="sm">
                    {ruleLabel(rule)}
                  </Badge>{' '}
                  <code style={{ fontSize: font.size.sm, color: color.textMuted }}>{rule}</code>
                </span>
                {ruleDescription(rule) ? (
                  <span style={{ fontSize: font.size.sm, color: color.textSecondary }}>{ruleDescription(rule)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Payment" headingLevel={2}>
          <DetailList
            items={[
              { term: 'Review', value: <IdCell value={review.id} resourceLabel="review id" head={14} tail={6} /> },
              {
                term: 'Merchant',
                value: (
                  <Link to={ADMIN_ROUTES.merchants.detail(review.merchant_id)} style={{ color: color.textLink }}>
                    {review.merchant_id}
                  </Link>
                ),
              },
              { term: 'Payment intent', value: <IdCell value={review.payment_intent_id} resourceLabel="payment intent id" head={14} tail={6} /> },
              { term: 'Charge', value: <IdCell value={review.charge_id} resourceLabel="charge id" head={14} tail={6} /> },
              { term: 'Countries', value: describeCountries(review) },
              { term: 'Mode', value: review.livemode ? 'Live' : 'Test' },
              { term: 'Opened', value: <DateCell value={review.opened_at} absolute /> },
              { term: 'Closed', value: <DateCell value={review.closed_at} absolute /> },
              { term: 'Closed by', value: review.closed_by },
              { term: 'Note', value: review.note },
            ]}
          />
        </Card>
      </PageSections>

      <ConfirmActionDialog
        open={dialog === 'approve'}
        onOpenChange={(next) => (next ? setDialog('approve') : close())}
        title="Approve this payment?"
        description="The authorisation is captured and the shopper is charged and sent a receipt. The merchant sees the payment succeed."
        confirmLabel="Approve payment"
        note={{
          id: 'review-approve-note',
          label: 'Note',
          hint: 'Why this looks legitimate. Kept on the review.',
          maxLength: 1000,
        }}
        isPending={decision.isPending}
        errorMessage={decision.errorMessage}
        onConfirm={(note) => decision.run({ reviewId: review.id, decision: 'approve', note }, { onSuccess: close })}
      >
        <ReviewSummary amount={<MoneyCell amountMinor={review.amount_minor} currency={review.currency} />} score={review.risk_score} />
      </ConfirmActionDialog>

      <ConfirmActionDialog
        open={dialog === 'decline'}
        onOpenChange={(next) => (next ? setDialog('decline') : close())}
        title="Decline this payment?"
        description="The authorisation is voided and the payment is cancelled as fraudulent. The shopper is told the payment was declined and is never charged."
        confirmLabel="Decline payment"
        confirmVariant="danger"
        note={{
          id: 'review-decline-note',
          label: 'Note',
          hint: 'What made this fraud. Kept on the review.',
          maxLength: 1000,
        }}
        isPending={decision.isPending}
        errorMessage={decision.errorMessage}
        onConfirm={(note) => decision.run({ reviewId: review.id, decision: 'decline', note }, { onSuccess: close })}
      >
        <ReviewSummary amount={<MoneyCell amountMinor={review.amount_minor} currency={review.currency} />} score={review.risk_score} />
      </ConfirmActionDialog>
    </PageContainer>
  );
}

function ReviewSummary({ amount, score }: { amount: ReactNode; score: number }) {
  return (
    <p style={{ margin: 0, display: 'flex', gap: space[4], fontSize: font.size.md }}>
      <span>
        <span style={visuallyHidden as CSSProperties}>Amount: </span>
        {amount}
      </span>
      <span>Risk score {score}</span>
    </p>
  );
}
