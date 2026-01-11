/**
 * `PaymentsPage` — the payments index route. `PaymentIntentDetailPage` is its child.
 */
import type { PaymentIntentStatus } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useQueryParamState } from '@hooks/useQueryParamState';

import { PaymentIntentTable } from './components/PaymentIntentTable';
import { usePaymentIntents } from './usePaymentIntents';

const STATUS_OPTIONS: ReadonlyArray<PaymentIntentStatus | 'all'> = [
  'all',
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'requires_capture',
  'processing',
  'succeeded',
  'failed',
  'canceled',
];

export function PaymentsPage() {
  useDocumentTitle('Payments');

  const [status, setStatus] = useQueryParamState<PaymentIntentStatus | 'all'>('status', 'all');
  const [customer, setCustomer] = useQueryParamState<string>('customer', '');
  const [cursor, setCursor] = useQueryParamState<string>('cursor', '');

  // Typing a customer reference should not fire one request per keystroke.
  const debouncedCustomer = useDebouncedValue(customer, 300);

  const { rows, isLoading, isFetching, hasMore, nextCursor, error } = usePaymentIntents({
    ...(status === 'all' ? {} : { status }),
    ...(debouncedCustomer ? { customer_reference: debouncedCustomer } : {}),
    ...(cursor ? { cursor } : {}),
  });

  return (
    <PageContainer as="main">
      <PageHeader
        title="Payments"
        description="Every payment intent your integration has created."
        isBusy={isFetching}
      />

      <FilterBar label="Payment filters">
        <Select
