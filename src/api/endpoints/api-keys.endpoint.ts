import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListQuery,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/**
 * `GET /v1/api-keys`, `GET /v1/api-keys/:apiKeyId`, `POST /v1/api-keys`,
 * `DELETE /v1/api-keys/:apiKeyId` (api-surface.md §4).
 *
 * The plaintext secret comes back exactly once, on create. `SecretRevealOnce` is the only
 * component that ever holds it and it never enters the query cache — see
 * `developers.queries.ts`.
 */
export class ApiKeysEndpoint extends ResourceEndpoint<ApiKey, ListQuery> {
  protected readonly basePath = '/api-keys';

  constructor(client: HttpTransport) {
    super(client);
  }

  create(
    req: CreateApiKeyRequest,
    idempotencyKey: string = newIdempotencyKey(),
