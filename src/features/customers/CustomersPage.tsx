/**
 * `CustomersPage` — `/customers` (RFC platform-v2 §5). `CustomerDetailPage` is its child.
 *
 * Customers are created by checkout (or the merchant's server, with an api key); the console
 * finds and inspects them. Search is by email because that is what a support agent has in
 * front of them — the whole address: payzeno-api matches `?email=` exactly.
 *
 * Calls: `GET /v1/customers?email=&cursor=`.
 */
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { FilterBar } from '@components/data/FilterBar';
import { ErrorState } from '@components/feedback/ErrorState';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useStringParam } from '@hooks/useQueryParamState';
import { ROUTES } from '@/routes';
import type { CustomerRow } from '@/types/view-models';

import { customerColumns } from './customers.columns';
import { useCustomers } from './useCustomers';

export function CustomersPage() {
  useDocumentTitle('Customers');

  const navigate = useNavigate();
  const [email, setEmail] = useStringParam('email');
  const [cursor, setCursor] = useStringParam('cursor');
  const debouncedEmail = useDebouncedValue(email.trim(), 300);

  const { rows, isLoading, isFetching, hasMore, nextCursor, error } = useCustomers({
    ...(debouncedEmail ? { email: debouncedEmail } : {}),
    ...(cursor ? { cursor } : {}),
  });

  return (
    <PageContainer as="main">
      <PageHeader
        title="Customers"
        description="People who paid you through checkout, with their saved cards and subscriptions."
        isBusy={isFetching}
      />

      <FilterBar label="Customer search">
        <Label htmlFor="customer-email">Email</Label>
        <Input
          id="customer-email"
          type="search"
          value={email}
          placeholder="Full address, e.g. name@example.com"
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </FilterBar>

      {error ? (
        <ErrorState error={error} title="We could not load your customers" />
      ) : (
        <>
          <DataTable<CustomerRow>
            caption={
              debouncedEmail
                ? `Customers with the email ${debouncedEmail}`
                : 'Customers, newest first'
            }
            columns={customerColumns}
            rows={rows}
            isLoading={isLoading}
            onRowClick={(row) => navigate(ROUTES.customers.detail(row.id))}
            emptyState={
              debouncedEmail ? (
                <EmptyRows
                  title="No matches"
                  body="No customer has exactly that email address. Check the spelling and use the whole address."
                />
              ) : (
                <EmptyRows
                  title="No customers yet"
                  body="A customer is created when someone checks out with their email or starts a subscription."
                />
              )
            }
          />
          <DataTablePagination
            hasMore={hasMore}
            onNext={() => setCursor(nextCursor ?? '')}
            onReset={() => setCursor('')}
            isBusy={isLoading}
          />
        </>
      )}
    </PageContainer>
  );
}
