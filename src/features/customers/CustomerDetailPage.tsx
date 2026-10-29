/**
 * `CustomerDetailPage` — `/customers/:customerId` (RFC platform-v2 §5).
 *
 * Profile, saved cards (removable), payments and subscriptions. The last two are other
 * features' hooks, filtered to this customer — there is one payments table and one
 * subscriptions table in the console, and this page reuses both.
 *
 * Calls: `GET /v1/customers/:id`, `GET /v1/customers/:id/payment_methods`,
 * `DELETE /v1/customers/:id/payment_methods/:pm`, `GET /v1/payment_intents?limit=100` (narrowed
 * to this customer in the browser — the api has no `customer_id` filter on that route yet),
 * `GET /v1/subscriptions?customer_id=`, `GET /v1/prices`.
 */
import { useParams } from 'react-router-dom';

import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Card } from '@components/ui/Card';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import { ROUTES } from '@/routes';
import { SubscriptionTable } from '@features/billing/components/SubscriptionTable';
import { useSubscriptions } from '@features/billing/useSubscriptions';
import { PaymentIntentTable } from '@features/payments/components/PaymentIntentTable';
import { usePaymentIntents } from '@features/payments/usePaymentIntents';

import { SavedCards } from './components/SavedCards';
import { customerLabel } from './customer-label';
import { useCustomer } from './useCustomer';
import { useCustomerPaymentMethods } from './useCustomerPaymentMethods';
import { useRemovePaymentMethod } from './useRemovePaymentMethod';

/** The api's page-size cap. Older payments are on the payments page. */
const RECENT_PAYMENTS_WINDOW = 100;

export function CustomerDetailPage() {
  const { customerId = '' } = useParams<{ customerId: string }>();
  useDocumentTitle(customerId ? `Customer ${customerId}` : 'Customer');

  const { can } = usePermissions();
  const { customer, isLoading, isMissing, error } = useCustomer(customerId);
  const cards = useCustomerPaymentMethods(customer);
  const removal = useRemovePaymentMethod(customerId);
  const payments = usePaymentIntents(
    { limit: RECENT_PAYMENTS_WINDOW },
    { enabled: customerId.length > 0, customerId },
  );
  const subscriptions = useSubscriptions({ customer_id: customerId });

  if (isMissing) {
    return (
      <NotFound
        title="No such customer"
        body="It may belong to another account, or to the other mode."
        homeTo={ROUTES.customers.index}
      />
    );
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this customer" />;
  }
  if (isLoading || !customer) {
    return <LoadingPage label="Loading customer" />;
  }

  return (
    <PageContainer as="main">
      <PageHeader
        title={customerLabel(customer)}
        description={customer.email ?? undefined}
        breadcrumbs={[
          { label: 'Customers', to: ROUTES.customers.index },
          { label: customerLabel(customer) },
        ]}
      />

      <Card as="section" aria-label="Customer profile">
        <dl>
          <dt>Name</dt>
          <dd>{customer.name ?? '—'}</dd>
          <dt>Email</dt>
          <dd>{customer.email ?? '—'}</dd>
          <dt>Customer id</dt>
          <dd>
            <IdCell value={customer.id} />
          </dd>
          <dt>Created</dt>
          <dd>
            <DateCell value={customer.created_at} />
          </dd>
          {Object.entries(customer.metadata).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Saved cards" headingLevel={2}>
        {cards.error ? (
          <ErrorState error={cards.error} title="We could not load the saved cards" />
        ) : (
          <SavedCards
            rows={cards.rows}
            isLoading={cards.isLoading}
            canRemove={can('payments:write')}
            onRemove={removal.remove}
            pendingId={removal.pendingId}
            errorMessage={removal.errorMessage}
          />
        )}
      </Card>

      <Card title="Subscriptions" headingLevel={2} flush>
        {subscriptions.error ? (
          <ErrorState error={subscriptions.error} title="We could not load the subscriptions" />
        ) : (
          <SubscriptionTable
            rows={subscriptions.rows}
            isLoading={subscriptions.isLoading}
            caption={`Subscriptions for ${customerLabel(customer)}`}
          />
        )}
      </Card>

      <Card
        title="Payments"
        headingLevel={2}
        description={`This customer's payments among your ${RECENT_PAYMENTS_WINDOW} most recent.`}
        flush
      >
        {payments.error ? (
          <ErrorState error={payments.error} title="We could not load the payments" />
        ) : (
          // The most recent page only; the payments page has the full, filterable list.
          <PaymentIntentTable
            rows={payments.rows}
            isLoading={payments.isLoading}
            hasMore={false}
            nextCursor={null}
            onCursorChange={() => undefined}
          />
        )}
      </Card>
    </PageContainer>
  );
}
