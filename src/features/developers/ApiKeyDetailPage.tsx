/**
 * `ApiKeyDetailPage` — child route of `DevelopersPage`.
 *
 * Exists because `ResourceEndpoint.get(id)` is mandatory on all ten concretes
 * (interfaces.md §4.2), and because a developer chasing a `401 invalid_api_key` in their logs
 * has a key id and nothing else. The page answers: is this key live, is it revoked, and what
 * is it allowed to do.
 *
 * It never shows the secret. There is no code path in this repo that can.
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
import { StatusPill } from '@components/data/StatusPill';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { usePermissions } from '@hooks/usePermissions';
import { listSentence, pluralise } from '@lib/format';

import { useApiKey } from './useApiKey';
import { useApiKeys } from './useApiKeys';

export function ApiKeyDetailPage() {
  const { apiKeyId = '' } = useParams<{ apiKeyId: string }>();
  useDocumentTitle(apiKeyId ? `API key ${apiKeyId}` : 'API key');

  const { can } = usePermissions();
  const { apiKey, displayLabel, isRevoked, isLive, writeScopes, isLoading, isMissing, error } =
    useApiKey(apiKeyId);
  const { revoke, isRevoking, revokeError } = useApiKeys();

  if (isMissing) {
    return <NotFound title="No such key" body="It may have been created on another account." />;
  }
  if (error) {
    return <ErrorState error={error} title="We could not load this key" />;
  }
  if (isLoading || !apiKey) {
    return <LoadingPage label="Loading API key" />;
  }

  return (
    <PageContainer as="main">
      <PageHeader title={apiKey.name} description={displayLabel}>
        <StatusPill status={apiKey.mode} label={isLive ? 'Live' : 'Test'} />
        {!isRevoked && can('developers:write') ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isRevoking}
            onClick={() => revoke(apiKey.id)}
          >
            {isRevoking ? 'Revoking…' : 'Revoke key'}
          </Button>
        ) : null}
      </PageHeader>

      {isRevoked ? (
        <Alert tone="info" title="This key is revoked">
          Requests using it fail immediately with <code>401 invalid_api_key</code>.
        </Alert>
      ) : null}

      {isLive && writeScopes.length > 0 ? (
        <Alert tone="warning" title="This key can move money">
          It holds {listSentence(writeScopes)}. Treat it like a password: rotate it if it has
          ever been in a repository, a log line or a support ticket.
