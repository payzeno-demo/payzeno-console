/**
 * `PaymentIntentDetailPage` — child route of `PaymentsPage`.
 *
 * Capture and cancel both live here because they are the only two things a merchant can
 * legitimately do to a payment from the dashboard. Confirm belongs to the checkout page,
 * which holds the `client_secret`.
 *
 * RFC platform-v2 adds four read-only facts: the risk review holding the payment (§8, and it
 * removes both buttons while open — Payzeno risk captures or releases it, not the merchant),
 * the presentment when the shopper paid in another currency (§7), and links to the customer
 * (§5) and subscription (§6) the payment belongs to.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { Badge } from '@components/ui/Badge';
import { ROUTES } from '@/routes';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useMoneyFormat } from '@hooks/useMoneyFormat';

import { CaptureDialog } from './components/CaptureDialog';
import { NextActionCallout } from './components/NextActionCallout';
import { ReviewCallout } from './components/ReviewCallout';
import { statusHint } from './payments.columns';
import { presentmentSummary } from './risk';
import { useCancelPaymentIntent } from './useCancelPaymentIntent';
import { usePaymentIntent } from './usePaymentIntent';
import { reviewStateOf } from './usePaymentIntents';
import { useReview } from './useReview';

export function PaymentIntentDetailPage() {
  const { paymentIntentId = '' } = useParams<{ paymentIntentId: string }>();
  useDocumentTitle(paymentIntentId ? `Payment ${paymentIntentId}` : 'Payment');

  const [captureOpen, setCaptureOpen] = useState(false);
  const { intent, nextAction, isLoading, isMissing, error } = usePaymentIntent(paymentIntentId);
  const { cancel, isPending: isCancelling, errorMessage: cancelError } = useCancelPaymentIntent();
  const review = useReview(intent?.review_id ?? null);
  const { formatMinor } = useMoneyFormat();

  if (isMissing) {
    return <NotFound title="No such payment" body="It may belong to another account." />;
  }
  if (isLoading || !intent) {
    return <LoadingPage label="Loading payment" />;
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this payment" />;
  }

  // A held payment is Payzeno risk's to capture or release. The review is checked by its own
  // status once loaded; until then `review_id` + `requires_capture` is enough to hold back.
  const held =
    reviewStateOf(intent) === 'held' && (review.review ? review.review.status === 'open' : true);
  const capturable =
    !held && intent.status === 'requires_capture' && intent.capture_method === 'manual';
  const cancelable =
    !held &&
    (intent.status === 'requires_capture' ||
      intent.status === 'requires_confirmation' ||
      intent.status === 'requires_action');
  const paid = formatMinor(intent.amount_minor, intent.currency);

  return (
    <PageContainer as="main">
      <PageHeader title={`Payment ${intent.id}`} description={statusHint(intent.status)}>
        <StatusPill status={intent.status} label={intent.status.replace(/_/g, ' ')} />
        {held ? (
          <Badge tone="warning" srPrefix="Risk review">
            Held for review
          </Badge>
        ) : null}
        {capturable ? (
          <Button type="button" onClick={() => setCaptureOpen(true)}>
            Capture
          </Button>
        ) : null}
        {cancelable ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isCancelling}
            onClick={() => cancel({ paymentIntentId: intent.id, reason: 'requested_by_customer' })}
          >
            {isCancelling ? 'Releasing…' : 'Release authorisation'}
          </Button>
        ) : null}
      </PageHeader>

      {cancelError ? <ErrorState error={new Error(cancelError)} title="Cancel failed" /> : null}

      <NextActionCallout nextAction={nextAction} paymentIntentId={intent.id} />

      {intent.review_id ? (
        <ReviewCallout review={review.review} isLoading={review.isLoading} error={review.error} />
      ) : null}

      <Card as="section" aria-label="Payment details">
        <dl>
          <dt>Amount</dt>
          <dd>
            <MoneyCell amountMinor={intent.amount_minor} currency={intent.currency} />
          </dd>

          {intent.presentment ? (
            <>
              <dt>Shopper paid</dt>
              <dd data-testid="presentment">
                {presentmentSummary(paid, intent.presentment, formatMinor)}
              </dd>
            </>
          ) : null}

          <dt>Customer</dt>
          <dd>
            {intent.customer_id ? (
              <Link to={ROUTES.customers.detail(intent.customer_id)}>
                <IdCell value={intent.customer_id} />
              </Link>
            ) : (
              '—'
            )}
          </dd>

          <dt>Subscription</dt>
          <dd>
            {intent.subscription_id ? (
              <Link to={ROUTES.billing.subscription(intent.subscription_id)}>
                <IdCell value={intent.subscription_id} />
              </Link>
            ) : (
              '—'
            )}
          </dd>

          <dt>Receipt email</dt>
          <dd>{intent.receipt_email ?? '—'}</dd>

          <dt>Capture method</dt>
          <dd>{intent.capture_method}</dd>

          <dt>Customer reference</dt>
          <dd>{intent.customer_reference ?? '—'}</dd>

          <dt>Description</dt>
          <dd>{intent.description ?? '—'}</dd>

          <dt>Statement descriptor</dt>
          <dd>{intent.statement_descriptor ?? '—'}</dd>

          <dt>Latest charge</dt>
          <dd>
            {intent.latest_charge_id ? (
              <Link to={ROUTES.charges.detail(intent.latest_charge_id)}>
                <IdCell value={intent.latest_charge_id} />
              </Link>
            ) : (
              '—'
            )}
          </dd>

          <dt>Created</dt>
          <dd>
            <DateCell value={intent.created_at} />
          </dd>
        </dl>
      </Card>

      <CaptureDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        paymentIntentId={intent.id}
        authorisedMinor={intent.amount_minor}
        currency={intent.currency}
      />
    </PageContainer>
  );
}
