/**
 * `useApiKey(id)` — `GET /v1/api-keys/:apiKeyId` (api-surface.md §12).
 *
 * The response never contains the secret — only the prefix and last four. If you are reading
 * this because a merchant lost their key: there is no recovery path by design. They rotate.
 */
import { useQuery } from '@tanstack/react-query';

import type { ApiKey, ApiKeyScope } from '@payzeno/contracts';

import { NotFoundApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { apiKeyQuery } from './developers.queries';

export interface UseApiKeyResult {
  apiKey: ApiKey | undefined;
  /** `sk_live_…1a2b` — the only representation of a key this console ever renders. */
  displayLabel: string;
  isRevoked: boolean;
  isLive: boolean;
  writeScopes: ApiKeyScope[];
  isLoading: boolean;
  isMissing: boolean;
  error: Error | null;
}

/**
 * `sk_live_…1a2b`. Mirrors `ApiKeysEndpoint.displayLabel`, which takes an instance we do not
 * have here — the registry hands us the endpoint, not the class.
 */
export function keyLabel(apiKey: ApiKey): string {
  return `${apiKey.prefix}…${apiKey.last_four}`;
}

export function useApiKey(apiKeyId: string): UseApiKeyResult {
  const endpoints = useEndpoints();
