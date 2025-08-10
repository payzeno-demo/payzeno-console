/**
 * `RefundsPage` — the refunds index route. There is no refund detail page: everything a
 * merchant needs about a refund is either in the row or on the charge it belongs to.
 *
 * Filters live in the URL (`useEnumParam`), because "the refunds I'm looking at" gets pasted
 * into Slack constantly.
 */
import { REFUND_STATUSES } from '@payzeno/contracts';
import type { RefundStatus } from '@payzeno/contracts';

import { ExportCsvButton } from '@components/data/ExportCsvButton';
import { FilterBar } from '@components/data/FilterBar';
import { ErrorState } from '@components/feedback/ErrorState';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { Select } from '@components/ui/Select';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam, useStringParam } from '@hooks/useQueryParamState';
import { humanise } from '@lib/format';

import { RefundTable } from './components/RefundTable';
import { refundColumns } from './refunds.columns';
import { useRefunds } from './useRefunds';

export function RefundsPage() {
  useDocumentTitle('Refunds');

  const [status, setStatus] = useEnumParam<RefundStatus>('status', REFUND_STATUSES);
  const [chargeId, setChargeId] = useStringParam('charge_id');
  const debouncedChargeId = useDebouncedValue(chargeId);

  const { rows, pagination, isLoading, isFetching, error } = useRefunds({
    ...(status ? { status } : {}),
    ...(debouncedChargeId ? { charge_id: debouncedChargeId } : {}),
  });

  return (
    <PageContainer as="main">
      <PageHeader
        title="Refunds"
        description="Every refund you have issued, newest first."
        isBusy={isFetching}
      >
        <ExportCsvButton rows={rows} columns={refundColumns} resource="refunds" />
      </PageHeader>

      <FilterBar label="Refund filters">
        <Select
          id="refund-status"
          label="Status"
          value={status ?? ''}
          onValueChange={(next) => setStatus(next === '' ? null : (next as RefundStatus))}
          options={[
            { value: '', label: 'All statuses' },
            ...REFUND_STATUSES.map((value) => ({ value, label: humanise(value) })),
          ]}
        />

        <Label htmlFor="refund-charge">Charge</Label>
        <Input
          id="refund-charge"
          name="charge_id"
          placeholder="ch_…"
          value={chargeId}
          onChange={(event) => setChargeId(event.target.value)}
        />
      </FilterBar>

      {error ? (
        <ErrorState error={error} title="We could not load your refunds" />
      ) : (
        <RefundTable rows={rows} isLoading={isLoading} pagination={pagination} />
      )}
    </PageContainer>
  );
}
