/**
 * `ChargeDetailPage` — child route of `ChargesPage`.
 *
 * The charge is the money object support and finance actually argue about, so this page is
 * deliberately dense: authorisation identifiers, the 3DS result (which decides who eats a
 * fraudulent chargeback), the settlement batch, and the double-entry postings.
 *
 * Refunding is the one mutation reachable from here, and it opens the refunds feature's
 * dialog rather than reimplementing it — there is exactly one refund form in this repo.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { CardBrandCell } from '@components/data/CardBrandCell';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { RefundDialog } from '@features/refunds/components/RefundDialog';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useMoneyFormat } from '@hooks/useMoneyFormat';
import { usePermissions } from '@hooks/usePermissions';
import { humanise } from '@lib/format';
import { ROUTES } from '@/routes';

import { ChargeLedgerPanel } from './components/ChargeLedgerPanel';
import { useCharge } from './useCharge';

export function ChargeDetailPage() {
  const { chargeId = '' } = useParams<{ chargeId: string }>();
  useDocumentTitle(chargeId ? `Charge ${chargeId}` : 'Charge');

  const [refundOpen, setRefundOpen] = useState(false);
  const { charge, card, refundableMinor, isLoading, isMissing, error } = useCharge(chargeId);
  const { can, readOnly } = usePermissions();
  const { formatMinor } = useMoneyFormat();

  if (isMissing) {
    return (
      <NotFound
        title="No such charge"
        body="It may belong to another account, or the id may be from test mode."
      />
    );
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this charge" />;
  }
  if (isLoading || !charge) {
    return <LoadingPage label="Loading charge" />;
  }

  const refundable = refundableMinor > 0 && (charge.status === 'captured' || charge.status === 'settled');
  const liabilityShifted = charge.three_d_secure?.liability_shifted ?? false;

  return (
    <PageContainer as="main">
      <PageHeader
        title={`Charge ${charge.id}`}
        description={`${humanise(charge.status)} · ${charge.acquirer}`}
      >
        <StatusPill status={charge.status} label={humanise(charge.status)} />
        <Button
          type="button"
          disabled={!refundable || readOnly || !can('refunds:write')}
          onClick={() => setRefundOpen(true)}
        >
          Refund
        </Button>
      </PageHeader>

      {charge.failure_code ? (
        <Alert tone="critical" title={`Declined — ${humanise(charge.failure_code)}`}>
          {charge.failure_message ?? 'The issuer did not give a reason beyond the decline code.'}
        </Alert>
      ) : null}

      {charge.status === 'captured' && !charge.settlement_batch_id ? (
        <Alert tone="info" title="Not settled yet">
          Captured funds appear in your balance as pending until the acquirer settlement file
          for this charge is reconciled.
        </Alert>
      ) : null}

      <Card as="section" aria-label="Amounts">
        <dl>
          <dt>Authorised</dt>
          <dd>
            <MoneyCell amountMinor={charge.amount_minor} currency={charge.currency} />
          </dd>

          <dt>Captured</dt>
          <dd>
            <MoneyCell amountMinor={charge.captured_amount_minor} currency={charge.currency} />
          </dd>

          <dt>Refunded</dt>
          <dd>
            <MoneyCell amountMinor={charge.refunded_amount_minor} currency={charge.currency} />
          </dd>

          <dt>Refundable</dt>
          <dd>{formatMinor(refundableMinor, charge.currency)}</dd>
        </dl>
      </Card>

      <Card as="section" aria-label="Card and authentication">
        <dl>
          <dt>Card</dt>
          <dd>{card ? <CardBrandCell card={card} /> : '—'}</dd>

          <dt>3-D Secure</dt>
          <dd>
            {charge.three_d_secure
