/**
 * `PayoutsPage` — the payouts index route. `PayoutDetailPage` is its child.
 *
 * This is where `payout.failed` surfaces (world-spec topology: payzeno-ledger emits it,
 * payzeno-api relays it, the console renders it). The push arrives on the notification
 * socket, `useNotificationStream` invalidates `queryKeys.payouts.all`, and this page reads the
 * unread `payout.failed` entries straight off the notification context so the merchant sees
 * the alert here as well as in the bell — a failed payout is the single most expensive thing
 * a merchant can miss.
 */
import { useMemo, useState } from 'react';

import { PAYOUT_STATUSES } from '@payzeno/contracts';
import type { CurrencyCode, PayoutStatus } from '@payzeno/contracts';

import { ExportCsvButton } from '@components/data/ExportCsvButton';
import { FilterBar } from '@components/data/FilterBar';
import { ErrorState } from '@components/feedback/ErrorState';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { CurrencySelect } from '@components/form/CurrencySelect';
import { useNotifications } from '@app/NotificationProvider';
import { useCurrentMerchant } from '@app/SessionContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam, useStringParam } from '@hooks/useQueryParamState';
import { usePermissions } from '@hooks/usePermissions';
import { humanise, pluralise } from '@lib/format';
import { useBalance } from '@features/balance/useBalance';

import { CreatePayoutDialog } from './components/CreatePayoutDialog';
import { PayoutTable } from './components/PayoutTable';
import { payoutColumns } from './payouts.columns';
import { usePayouts } from './usePayouts';

export function PayoutsPage() {
  useDocumentTitle('Payouts');

  const merchant = useCurrentMerchant();
  const { can, readOnly } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);

  const [currency, setCurrency] = useStringParam('currency', merchant.default_currency);
  const [status, setStatus] = useEnumParam<PayoutStatus>('status', PAYOUT_STATUSES);

  const { rows, failedCount, pagination, isLoading, isFetching, error } = usePayouts({
    currency: currency as CurrencyCode,
    ...(status ? { status } : {}),
  });
  const { balance } = useBalance(currency as CurrencyCode);

  // The live half of the alert: unread `payout.failed` pushes that arrived while this tab was
  // open. `markRead` is deliberately not called here — the bell owns read state.
  const { entries } = useNotifications();
  const liveFailures = useMemo(
    () => entries.filter((entry) => entry.type === 'payout.failed' && !entry.read),
    [entries],
  );
