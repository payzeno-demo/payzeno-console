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
