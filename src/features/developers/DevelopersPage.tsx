/**
 * `DevelopersPage` — API keys, webhook endpoints and webhook delivery, in one route.
 * `ApiKeyDetailPage` and `WebhookEventDetailPage` are its children.
 *
 * The create-key form lives inline rather than in a dialog: the secret reveal that follows it
 * must stay on screen while the developer copies the key, and a dialog that closes takes the
 * only copy of the secret with it.
 */
import { useState } from 'react';

import { API_KEY_SCOPES } from '@payzeno/contracts';
import type { ApiKeyMode, ApiKeyScope, PublicEventType } from '@payzeno/contracts';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { FilterBar } from '@components/data/FilterBar';
import { ErrorState } from '@components/feedback/ErrorState';
import { InlineError } from '@components/feedback/InlineError';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { Select } from '@components/ui/Select';
import { Tabs } from '@components/ui/Tabs';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import { useStringParam } from '@hooks/useQueryParamState';
import { allFlags } from '@lib/flags';
import { pluralise } from '@lib/format';

import { apiKeyColumns } from './api-keys.columns';
import { SecretRevealOnce } from './components/SecretRevealOnce';
import { useApiKeys } from './useApiKeys';
import { useCreateApiKey } from './useCreateApiKey';
import { useWebhookEndpoints } from './useWebhookEndpoints';
import { useWebhookEvents } from './useWebhookEvents';
import { COMMON_EVENT_TYPES, webhookEventColumns } from './webhook-events.columns';

const TABS = [
  { value: 'keys', label: 'API keys' },
  { value: 'webhooks', label: 'Webhooks' },
  { value: 'build', label: 'Build info' },
];

export function DevelopersPage() {
  useDocumentTitle('Developers');

  const { can } = usePermissions();
  const [tab, setTab] = useStringParam('tab', 'keys');
  const [keyName, setKeyName] = useState('');
  const [keyMode, setKeyMode] = useState<ApiKeyMode>('test');
  const [eventType, setEventType] = useStringParam('type', '');

  const { liveKeys, testKeys, revokedKeys, isLoading: keysLoading, error: keysError, revoke, revokeError } =
    useApiKeys();
  const { createApiKey, isPending, createdKey, secret, clearSecret, errorMessage, fieldErrors } =
    useCreateApiKey();

  const { rows: events, deadCount, pagination, isLoading: eventsLoading, error: eventsError } =
    useWebhookEvents({ ...(eventType ? { type: eventType as PublicEventType } : {}) });
  const { endpoints, enabledCount, isLoading: endpointsLoading } = useWebhookEndpoints();

  const canWrite = can('developers:write');
  // Read scopes by default: a key that can move money should be an explicit choice.
  const defaultScopes: ApiKeyScope[] = API_KEY_SCOPES.filter((scope) => scope.endsWith(':read'));

  return (
    <PageContainer as="main">
      <PageHeader
        title="Developers"
        description="Keys, webhooks and everything you need to integrate."
      />

      <Tabs value={tab} onValueChange={setTab} label="Developer sections" tabs={TABS} />

      {tab === 'keys' ? (
        <>
          {secret && createdKey ? (
            <SecretRevealOnce apiKey={createdKey} secret={secret} onDismiss={clearSecret} />
          ) : null}

          <Card as="section" aria-labelledby="create-key-heading">
            <h2 id="create-key-heading">Create a key</h2>
            <Label htmlFor="key-name">Name</Label>
            <Input
              id="key-name"
              name="name"
              placeholder="Checkout service"
              value={keyName}
              disabled={!canWrite}
              aria-describedby={fieldErrors.name ? 'key-name-error' : undefined}
              onChange={(event) => setKeyName(event.target.value)}
            />
            {fieldErrors.name ? (
              <InlineError id="key-name-error">{fieldErrors.name}</InlineError>
            ) : null}

            <Select
              id="key-mode"
              label="Mode"
              value={keyMode}
              onValueChange={(next) => setKeyMode(next as ApiKeyMode)}
              options={[
                { value: 'test', label: 'Test' },
                { value: 'live', label: 'Live' },
              ]}
            />

            {errorMessage ? <InlineError id="key-error">{errorMessage}</InlineError> : null}

            <Button
              type="button"
              disabled={!canWrite || isPending || keyName.trim().length === 0}
              onClick={() => createApiKey({ name: keyName, mode: keyMode, scopes: defaultScopes })}
            >
              {isPending ? 'Creating…' : 'Create key'}
            </Button>
            <p>New keys get read scopes only. Ask support to widen them.</p>
          </Card>

          {keysError ? <ErrorState error={keysError} title="We could not load your keys" /> : null}
          {revokeError ? <InlineError id="revoke-error">{revokeError}</InlineError> : null}

          <DataTable
            caption="Live API keys"
            columns={apiKeyColumns}
            rows={liveKeys}
            isLoading={keysLoading}
            rowActions={(row) =>
              canWrite ? (
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Revoke ${row.name}`}
                  onClick={() => revoke(row.id)}
                >
                  Revoke
                </Button>
              ) : null
            }
            emptyState={
              <EmptyRows title="No live keys" body="Create one when you are ready to go live." />
            }
          />

          <DataTable
            caption="Test API keys"
            columns={apiKeyColumns}
            rows={testKeys}
            isLoading={keysLoading}
            emptyState={<EmptyRows title="No test keys" body="Create one to start integrating." />}
          />

          {revokedKeys.length > 0 ? (
            <DataTable
              caption="Revoked API keys"
              columns={apiKeyColumns}
              rows={revokedKeys}
              isLoading={false}
              emptyState={<EmptyRows title="None" body="" />}
            />
          ) : null}
        </>
      ) : null}

      {tab === 'webhooks' ? (
        <>
          {deadCount > 0 ? (
            <Alert tone="warning" title="Some events were given up on" role="status">
              {pluralise(deadCount, 'event')} exhausted every retry. Fix the endpoint, then
              redeliver them individually.
            </Alert>
          ) : null}

          <Card as="section" aria-label="Webhook endpoints">
            <h2>Endpoints</h2>
            {endpointsLoading ? (
              <p>Loading endpoints…</p>
            ) : (
              <ul>
                {endpoints.map((endpoint) => (
                  <li key={endpoint.id}>
                    <code>{endpoint.url}</code> — {endpoint.status},{' '}
                    {pluralise(endpoint.enabled_events.length, 'event type')}
