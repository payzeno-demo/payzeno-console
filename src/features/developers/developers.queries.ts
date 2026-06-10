/**
 * Query/mutation factories for `features/developers`. The ONLY caller of `ApiKeysEndpoint`,
 * `WebhookEventsEndpoint` and `WebhookEndpointsEndpoint`.
 *
 * One rule dominates this file: **the plaintext API key secret never enters the query cache.**
 * `POST /v1/api-keys` returns it exactly once, `SecretRevealOnce` holds it in component state,
 * and the create mutation deliberately does not write it back into any key. A secret in the
 * cache is a secret in a devtools snapshot.
 */
import { queryOptions } from '@tanstack/react-query';

import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListQuery,
  Paginated,
  WebhookEndpoint,
  WebhookEvent,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import type { WebhookEventListQuery } from '@api/endpoints/webhook-events.endpoint';
import { queryKeys } from '@api/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

export function apiKeysQuery(e: EndpointRegistry, q?: ListQuery) {
  return queryOptions<Paginated<ApiKey>>({
    queryKey: queryKeys.apiKeys.list(),
    queryFn: () => e.apiKeys.list(q),
    staleTime: 60_000,
  });
}

export function apiKeyQuery(e: EndpointRegistry, apiKeyId: string) {
  return queryOptions<ApiKey>({
    queryKey: queryKeys.apiKeys.detail(apiKeyId),
    queryFn: () => e.apiKeys.get(apiKeyId),
    enabled: apiKeyId.length > 0,
    staleTime: 60_000,
  });
}

export function webhookEventsQuery(e: EndpointRegistry, q?: WebhookEventListQuery) {
  const query: WebhookEventListQuery = { limit: DEFAULT_PAGE_SIZE, ...(q ?? {}) };
  return queryOptions<Paginated<WebhookEvent>>({
    queryKey: queryKeys.webhookEvents.list(query),
    queryFn: () => e.webhookEvents.list(query),
    // Delivery attempts retry on a backoff, so this list genuinely moves while you watch it.
    staleTime: 10_000,
  });
}

export function webhookEventQuery(e: EndpointRegistry, eventId: string) {
  return queryOptions<WebhookEvent>({
    queryKey: queryKeys.webhookEvents.detail(eventId),
    queryFn: () => e.webhookEvents.get(eventId),
    enabled: eventId.length > 0,
    staleTime: 10_000,
  });
}

export function webhookEndpointsQuery(e: EndpointRegistry) {
  return queryOptions<Paginated<WebhookEndpoint>>({
    queryKey: queryKeys.webhookEndpoints.list(),
    queryFn: () => e.webhookEndpoints.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export interface CreateApiKeyInput {
  request: CreateApiKeyRequest;
}

/** The response carries `secret`. Do not put the result of this into the cache. */
export function createApiKeyMutation(e: EndpointRegistry) {
  return {
