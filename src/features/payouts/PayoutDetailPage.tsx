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
}
