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
