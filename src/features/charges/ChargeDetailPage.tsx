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
