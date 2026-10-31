/**
 * `PricesPage` — Billing → Prices, `/billing/prices` (RFC platform-v2 §6).
 *
 * Calls: `GET /v1/prices`, `POST /v1/prices`.
 */
import { useState } from 'react';

import { DataTable } from '@components/data/DataTable';
import { EmptyRows } from '@components/data/EmptyRows';
import { ErrorState } from '@components/feedback/ErrorState';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Button } from '@components/ui/Button';
import { useCurrentMerchant } from '@app/SessionContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import type { PriceRow } from '@/types/view-models';

import { BillingTabs } from './components/BillingTabs';
import { CreatePriceDialog } from './components/CreatePriceDialog';
import { priceColumns } from './prices.columns';
import { usePrices } from './usePrices';

export function PricesPage() {
  useDocumentTitle('Prices');

  const merchant = useCurrentMerchant();
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const { rows, isLoading, isFetching, error } = usePrices();
  const canWrite = can('payments:write');

  return (
    <PageContainer as="main">
      <PageHeader
        title="Prices"
        description="What you charge: one-off prices for checkout, recurring prices for subscriptions."
        isBusy={isFetching}
      >
        <Button
          type="button"
          disabled={!canWrite}
          title={canWrite ? undefined : 'Creating a price needs an owner or admin role.'}
          onClick={() => setCreateOpen(true)}
        >
          New price
        </Button>
      </PageHeader>

      <BillingTabs />

      {error ? (
        <ErrorState error={error} title="We could not load your prices" />
      ) : (
        <DataTable<PriceRow>
          caption="Your prices, one-off and recurring"
          columns={priceColumns}
          rows={rows}
          isLoading={isLoading}
          emptyState={
            <EmptyRows
              title="No prices yet"
              body="Create a recurring price to start selling subscriptions through checkout."
            />
          }
        />
      )}

      <CreatePriceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCurrency={merchant.default_currency}
      />
    </PageContainer>
  );
}
