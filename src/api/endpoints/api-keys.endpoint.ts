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
  ): Promise<CreateApiKeyResponse> {
    return this.client.post<CreateApiKeyResponse, CreateApiKeyRequest>(
      this.basePath,
      req,
      idempotencyKey,
    );
  }

  /** Revocation is immediate; `ApiKeyGuard` fails closed on `revoked_at != null`. */
  revoke(apiKeyId: string, idempotencyKey: string = newIdempotencyKey()): Promise<void> {
    return this.client.delete(this.resourcePath(apiKeyId), idempotencyKey);
  }

  /** `sk_live_…` / `sk_test_…` — never `pk_`, which means *publishable* everywhere else. */
  displayLabel(key: ApiKey): string {
    return `${key.prefix}…${key.last_four}`;
  }
}
