/**
 * `PaymentIntentDetailPage` — child route of `PaymentsPage`.
 *
 * Capture and cancel both live here because they are the only two things a merchant can
 * legitimately do to a payment from the dashboard. Confirm belongs to the checkout page,
 * which holds the `client_secret`.
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
import { ROUTES } from '@/routes';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

import { CaptureDialog } from './components/CaptureDialog';
import { NextActionCallout } from './components/NextActionCallout';
import { statusHint } from './payments.columns';
import { useCancelPaymentIntent } from './useCancelPaymentIntent';
import { usePaymentIntent } from './usePaymentIntent';

export function PaymentIntentDetailPage() {
  const { paymentIntentId = '' } = useParams<{ paymentIntentId: string }>();
  useDocumentTitle(paymentIntentId ? `Payment ${paymentIntentId}` : 'Payment');

  const [captureOpen, setCaptureOpen] = useState(false);
  const { intent, nextAction, isLoading, isMissing, error } = usePaymentIntent(paymentIntentId);
  const { cancel, isPending: isCancelling, errorMessage: cancelError } = useCancelPaymentIntent();

  if (isMissing) {
    return <NotFound title="No such payment" body="It may belong to another account." />;
  }
  if (isLoading || !intent) {
    return <LoadingPage label="Loading payment" />;
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this payment" />;
  }

  const capturable = intent.status === 'requires_capture' && intent.capture_method === 'manual';
  const cancelable =
    intent.status === 'requires_capture' ||
    intent.status === 'requires_confirmation' ||
    intent.status === 'requires_action';

  return (
    <PageContainer as="main">
      <PageHeader title={`Payment ${intent.id}`} description={statusHint(intent.status)}>
        <StatusPill status={intent.status} label={intent.status.replace(/_/g, ' ')} />
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

      <Card as="section" aria-label="Payment details">
        <dl>
          <dt>Amount</dt>
          <dd>
            <MoneyCell amountMinor={intent.amount_minor} currency={intent.currency} />
          </dd>

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
            <DateCell value={intent.created_at} precision="minute" />
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
