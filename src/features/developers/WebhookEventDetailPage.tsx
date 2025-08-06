/**
 * `WebhookEventDetailPage` — child route of `DevelopersPage`.
 *
 * The payload is rendered verbatim. It is the merchant's own event, it never contains
 * cardholder data (payzeno-api's `WebhookFanoutConsumer` builds it from the public projection),
 * and a developer debugging a signature mismatch needs the exact bytes we sent.
 *
 * `source_event_id` is the bus envelope id. It is what support correlates against the ledger's
 * outbox when a merchant swears they never got a `payout.failed`.
 */
import { useParams } from 'react-router-dom';

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
import { StatusPill } from '@components/data/StatusPill';
import { useCopyToClipboard } from '@hooks/useCopyToClipboard';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import { formatCount } from '@lib/format';

import { healthLabel } from './webhook-events.columns';
import { useWebhookEndpoints } from './useWebhookEndpoints';
import { useWebhookEvent } from './useWebhookEvent';

export function WebhookEventDetailPage() {
  const { eventId = '' } = useParams<{ eventId: string }>();
  useDocumentTitle(eventId ? `Webhook ${eventId}` : 'Webhook event');

  const { can } = usePermissions();
  const { copy, status: copyStatus, announcement } = useCopyToClipboard();
  const { event, health, canRedeliver, redeliver, isRedelivering, isLoading, isMissing, error, actionError } =
    useWebhookEvent(eventId);
  const { subscribedTo } = useWebhookEndpoints();

  if (isMissing) {
    return <NotFound title="No such webhook event" body="It may have been pruned." />;
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this delivery" />;
  }
  if (isLoading || !event) {
    return <LoadingPage label="Loading webhook delivery" />;
  }

  const payload = JSON.stringify(event.payload, null, 2);
  const otherListeners = subscribedTo(event.type).filter((e) => e.id !== event.endpoint_id);

  return (
    <PageContainer as="main">
      <PageHeader title={event.type} description={`Delivery ${event.id}`}>
        {health ? <StatusPill status={health} label={healthLabel(health)} /> : null}
        {canRedeliver && can('developers:write') ? (
          <Button type="button" disabled={isRedelivering} onClick={redeliver}>
            {isRedelivering ? 'Queueing…' : 'Redeliver'}
          </Button>
        ) : null}
      </PageHeader>

      {health === 'dead' ? (
        <Alert tone="warning" title="We stopped retrying this one">
          Every attempt failed. Fix the endpoint, then redeliver — the dedupe key is the source
          event, so your handler will see the same event id it would have seen originally.
        </Alert>
      ) : null}

      {actionError ? (
        <Alert tone="critical" title="Redelivery failed">
          {actionError}
        </Alert>
      ) : null}

      <Card as="section" aria-label="Delivery details">
        <dl>
          <dt>Endpoint</dt>
          <dd>
            <IdCell value={event.endpoint_id} />
          </dd>

          <dt>Source event</dt>
          <dd>
            <IdCell value={event.source_event_id} />
          </dd>

          <dt>Attempts</dt>
          <dd>{formatCount(event.attempt_count)}</dd>

          <dt>Last response</dt>
          <dd>{event.last_response_status ?? '—'}</dd>

          <dt>Last error</dt>
          <dd>{event.last_error ?? '—'}</dd>

          <dt>Next attempt</dt>
          <dd>
            <DateCell value={event.next_attempt_at} precision="minute" />
          </dd>

          <dt>Delivered</dt>
          <dd>
            <DateCell value={event.delivered_at} precision="minute" />
          </dd>

          <dt>Signature version</dt>
          <dd>{event.signature_version}</dd>
        </dl>
      </Card>

      {otherListeners.length > 0 ? (
        <Card as="section" aria-label="Other subscribed endpoints">
          <h2>Also subscribed to {event.type}</h2>
          <ul>
            {otherListeners.map((endpoint) => (
              <li key={endpoint.id}>
                <code>{endpoint.url}</code>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card as="section" aria-labelledby="payload-heading">
        <h2 id="payload-heading">Payload</h2>
        <Button type="button" variant="ghost" onClick={() => void copy(payload, 'payload')}>
          {copyStatus === 'copied' ? 'Copied' : 'Copy payload'}
        </Button>
        <p role="status" aria-live="polite">
          {announcement}
        </p>
        <pre>
          <code>{payload}</code>
        </pre>
      </Card>
    </PageContainer>
  );
}
