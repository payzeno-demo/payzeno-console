/**
 * `PayoutDetailPage` — child route of `PayoutsPage`.
 *
 * The failure panel is the reason this page exists. A merchant arriving from a `payout.failed`
 * notification wants three things: why it failed, whether the money is back, and what to do
 * next. `reversal_transaction_id` answers the second — and when it is missing on a failed
 * payout, that is money stuck in `payout_clearing` and the page says so plainly rather than
 * pretending the balance is fine.
 */
import { Link, useParams } from 'react-router-dom';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import { humanise, labelise } from '@lib/format';
import { ROUTES } from '@/routes';

import { failureHint } from './payouts.columns';
import { useCancelPayout } from './useCancelPayout';
import { usePayout } from './usePayout';

export function PayoutDetailPage() {
  const { payoutId = '' } = useParams<{ payoutId: string }>();
  useDocumentTitle(payoutId ? `Payout ${payoutId}` : 'Payout');

  const { payout, isCancelable, isFailed, awaitingReversal, isLoading, isMissing, error } =
    usePayout(payoutId);
  const { cancelPayout, isPending, alreadyInTransitId, errorMessage } = useCancelPayout();

  if (isMissing) {
    return <NotFound title="No such payout" body="It may belong to another account." />;
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this payout" />;
  }
  if (isLoading || !payout) {
    return <LoadingPage label="Loading payout" />;
  }

  return (
    <PageContainer as="main">
      <PageHeader
        title={`Payout ${payout.id}`}
        description={`${labelise(payout.method)} · ${payout.statement_descriptor}`}
      >
        <StatusPill status={payout.status} label={humanise(payout.status)} />
        {isCancelable ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isPending || !can('payouts:write')}
            onClick={() => cancelPayout(payout.id)}
          >
            {isPending ? 'Cancelling…' : 'Cancel payout'}
          </Button>
        ) : null}
      </PageHeader>

      {alreadyInTransitId === payout.id ? (
        <Alert tone="info" title="Already on its way">
          This payout entered the rail before the cancellation reached us. If it fails, the funds
          come back automatically.
        </Alert>
      ) : null}

      {errorMessage ? <Alert tone="critical" title="Cancellation failed">{errorMessage}</Alert> : null}

      {isFailed && payout.failure_code ? (
        <Alert tone="critical" title={`Payout failed — ${humanise(payout.failure_code)}`}>
          <p>{failureHint(payout.failure_code)}</p>
          {awaitingReversal ? (
            <p>
              The reversal has not posted yet, so this amount is not back in your available
              balance. If it is still missing in an hour, contact support with this payout id.
            </p>
          ) : (
            <p>The funds have been returned to your available balance.</p>
          )}
        </Alert>
      ) : null}

      <Card as="section" aria-label="Payout details">
        <dl>
          <dt>Amount</dt>
          <dd>
            <MoneyCell amountMinor={payout.amount_minor} currency={payout.currency} />
          </dd>

          <dt>Destination</dt>
          <dd>
            <Link to={ROUTES.settings.index}>
              <IdCell value={payout.bank_account_id} />
            </Link>
          </dd>

          <dt>Available on</dt>
          <dd>
            <DateCell value={payout.available_on} precision="day" />
          </dd>

          <dt>Expected arrival</dt>
          <dd>
            {payout.arrival_estimate ? (
              <DateCell value={payout.arrival_estimate} precision="day" />
            ) : (
              '—'
            )}
          </dd>

          <dt>Initiated</dt>
          <dd>
            <DateCell value={payout.initiated_at} precision="minute" />
          </dd>

          <dt>Paid</dt>
          <dd>
            <DateCell value={payout.paid_at} precision="minute" />
          </dd>

          <dt>Failed</dt>
          <dd>
            <DateCell value={payout.failed_at} precision="minute" />
          </dd>

          <dt>Returned</dt>
          <dd>
            <DateCell value={payout.returned_at} precision="minute" />
          </dd>
        </dl>
      </Card>

      <Card as="section" aria-label="Ledger references">
        <dl>
          <dt>Ledger transaction</dt>
          <dd>
            {payout.ledger_transaction_id ? <IdCell value={payout.ledger_transaction_id} /> : '—'}
          </dd>

          <dt>Reversal transaction</dt>
          <dd>
            {payout.reversal_transaction_id ? (
              <IdCell value={payout.reversal_transaction_id} />
            ) : (
              '—'
            )}
          </dd>
        </dl>
      </Card>
    </PageContainer>
  );
}
