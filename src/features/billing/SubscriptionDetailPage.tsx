/**
 * `SubscriptionDetailPage` — `/billing/subscriptions/:subscriptionId` (RFC platform-v2 §6).
 *
 * What a merchant needs when a customer writes in about their plan: is it active, when does it
 * renew, did the last payment work, and — when it is `past_due` — when Payzeno tries again.
 *
 * Calls: `GET /v1/subscriptions/:id`, `GET /v1/prices/:id`,
 * `GET /v1/payment_intents/:latest_payment_intent_id`, `GET /v1/customers/:id`,
 * `POST /v1/subscriptions/:id/cancel`.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import { formatTimestamp } from '@lib/date';
import { pluralise } from '@lib/format';
import { ROUTES } from '@/routes';
import { useCustomer } from '@features/customers/useCustomer';
import { usePaymentIntent } from '@features/payments/usePaymentIntent';

import { cadenceLabel, perCadence, subscriptionStatusLabel } from './billing.format';
import { CancelSubscriptionDialog } from './components/CancelSubscriptionDialog';
import { usePrice } from './usePrice';
import { useSubscription } from './useSubscription';

export function SubscriptionDetailPage() {
  const { subscriptionId = '' } = useParams<{ subscriptionId: string }>();
  useDocumentTitle(subscriptionId ? `Subscription ${subscriptionId}` : 'Subscription');

  const { can } = usePermissions();
  const [cancelOpen, setCancelOpen] = useState(false);
  const { subscription, isLoading, isMissing, error } = useSubscription(subscriptionId);
  const { price } = usePrice(subscription?.price_id ?? null);
  const { customer } = useCustomer(subscription?.customer_id ?? '');
  const latest = usePaymentIntent(subscription?.latest_payment_intent_id ?? '');

  if (isMissing) {
    return (
      <NotFound
        title="No such subscription"
        body="It may belong to another account, or to the other mode."
        homeTo={ROUTES.billing.subscriptions}
      />
    );
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this subscription" />;
  }
  if (isLoading || !subscription) {
    return <LoadingPage label="Loading subscription" />;
  }

  const canCancel = subscription.status !== 'canceled' && can('payments:write');

  return (
    <PageContainer as="main">
      <PageHeader
        title={`Subscription ${subscription.id}`}
        description={
          price ? `${price.product_name}, billed ${cadenceLabel(price.recurring)}` : undefined
        }
        breadcrumbs={[
          { label: 'Subscriptions', to: ROUTES.billing.subscriptions },
          { label: subscription.id },
        ]}
      >
        <StatusPill
          status={subscription.status}
          srPrefix="Subscription status"
          label={subscriptionStatusLabel(subscription)}
        />
        {subscription.status !== 'canceled' ? (
          <Button
            type="button"
            variant="secondary"
            disabled={!canCancel}
            title={canCancel ? undefined : 'Canceling needs an owner or admin role.'}
            onClick={() => setCancelOpen(true)}
          >
            Cancel subscription
          </Button>
        ) : null}
      </PageHeader>

      {subscription.status === 'past_due' ? (
        <Alert tone="warning" title="The last renewal failed">
          <p>
            {pluralise(subscription.failed_attempts, 'attempt')} failed this period. The customer
            has been emailed a link to update their card.{' '}
            {subscription.next_retry_at
              ? `Payzeno tries again ${formatTimestamp(subscription.next_retry_at)}.`
              : 'There are no retries left; the subscription is canceled if this one fails.'}
          </p>
        </Alert>
      ) : null}

      {subscription.cancel_at_period_end && subscription.status === 'active' ? (
        <Alert tone="info" title="Ends at period end">
          <p>
            No further renewals. The customer keeps access until{' '}
            {formatTimestamp(subscription.current_period_end)}.
          </p>
        </Alert>
      ) : null}

      <Card as="section" aria-label="Subscription details">
        <dl>
          <dt>Customer</dt>
          <dd>
            <Link to={ROUTES.customers.detail(subscription.customer_id)}>
              {customer?.name ?? customer?.email ?? <IdCell value={subscription.customer_id} />}
            </Link>
          </dd>

          <dt>Price</dt>
          <dd>
            {price ? (
              <>
                <MoneyCell amountMinor={price.unit_amount_minor} currency={price.currency} />
                {perCadence(price.recurring)} · {price.product_name}
              </>
            ) : (
              <IdCell value={subscription.price_id} />
            )}
          </dd>

          <dt>Current period</dt>
          <dd>
            <DateCell value={subscription.current_period_start} absolute /> –{' '}
            <DateCell value={subscription.current_period_end} absolute />
          </dd>

          <dt>Next renewal</dt>
          <dd>
            {subscription.status === 'active' && !subscription.cancel_at_period_end ? (
              <DateCell value={subscription.current_period_end} absolute />
            ) : (
              '—'
            )}
          </dd>

          <dt>Next retry</dt>
          <dd>
            {subscription.next_retry_at ? (
              <DateCell value={subscription.next_retry_at} absolute />
            ) : (
              '—'
            )}
          </dd>

          <dt>Failed attempts this period</dt>
          <dd>{subscription.failed_attempts}</dd>

          <dt>Latest payment</dt>
          <dd>
            {subscription.latest_payment_intent_id ? (
              <Link to={ROUTES.payments.detail(subscription.latest_payment_intent_id)}>
                {latest.intent ? (
                  <>
                    <MoneyCell
                      amountMinor={latest.intent.amount_minor}
                      currency={latest.intent.currency}
                    />{' '}
                    · {latest.intent.status.replace(/_/g, ' ')}
                  </>
                ) : (
                  <IdCell value={subscription.latest_payment_intent_id} />
                )}
              </Link>
            ) : (
              '—'
            )}
          </dd>

          <dt>Saved card</dt>
          <dd>
            {subscription.default_payment_method_id ? (
              <IdCell value={subscription.default_payment_method_id} />
            ) : (
              'Customer default'
            )}
          </dd>

          <dt>Canceled</dt>
          <dd>{subscription.canceled_at ? <DateCell value={subscription.canceled_at} /> : '—'}</dd>

          <dt>Started</dt>
          <dd>
            <DateCell value={subscription.created_at} />
          </dd>
        </dl>
      </Card>

      <CancelSubscriptionDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        subscription={subscription}
      />
    </PageContainer>
  );
}
