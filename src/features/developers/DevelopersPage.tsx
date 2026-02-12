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
