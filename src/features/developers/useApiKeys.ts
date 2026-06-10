/**
 * `useApiKeys()` — `GET /v1/api-keys` (api-surface.md §12).
 *
 * Live and revoked keys come back in one list; the console splits them, because a revoked key
 * is history and mixing the two is how someone rotates the key that is still in production.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import type { ApiKey } from '@payzeno/contracts';

import { ConsoleApiError, ForbiddenError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';
import type { ApiKeyRow } from '@/types/view-models';

import { apiKeysQuery, revokeApiKeyMutation } from './developers.queries';

export interface UseApiKeysResult {
  liveKeys: ApiKeyRow[];
  testKeys: ApiKeyRow[];
  revokedKeys: ApiKeyRow[];
  isLoading: boolean;
  error: Error | null;
  revoke: (apiKeyId: string) => void;
  isRevoking: boolean;
  revokeError: string | null;
}

function toRow(key: ApiKey): ApiKeyRow {
  return { ...key, _selected: false };
}

export function useApiKeys(): UseApiKeysResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const query = useQuery(apiKeysQuery(endpoints));
  const rows = useMemo(() => (query.data?.data ?? []).map(toRow), [query.data]);

  const mutation = useMutation({
    ...revokeApiKeyMutation(endpoints),
    onSuccess: async () => {
      toast.success('Key revoked. Any request using it now fails immediately.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
    },
    onError: (error: unknown) => {
      if (error instanceof ForbiddenError) {
        setRevokeError('Revoking a key needs an admin role.');
        return;
      }
      setRevokeError(
        error instanceof ConsoleApiError ? error.message : 'The key could not be revoked.',
      );
    },
  });

  const revoke = useCallback(
    (apiKeyId: string) => {
      setRevokeError(null);
      mutation.mutate({ apiKeyId });
    },
    [mutation],
  );

  const active = rows.filter((row) => row.revoked_at === null);

  return {
