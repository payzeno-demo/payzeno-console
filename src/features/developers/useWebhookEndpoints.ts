/**
 * `useWebhookEndpoints()` — `GET /v1/webhook_endpoints` (api-surface.md §12).
 *
 * `WebhookEndpointsEndpoint` is not a `ResourceEndpoint`: there is no
 * `GET /v1/webhook_endpoints/:id`, so an inherited `get(id)` would call a 404.
 *
 * The useful question this hook answers is not "what endpoints exist" but "which of my
 * endpoints would have received this event" — that is what explains a missing webhook, and
 * `WebhookEndpointsEndpoint.subscribedTo` is a static because it is pure filtering.
 */
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { PublicEventType, WebhookEndpoint } from '@payzeno/contracts';

import { WebhookEndpointsEndpoint } from '@api/endpoints/webhook-endpoints.endpoint';
import { useEndpoints } from '@app/ApiContext';

import { webhookEndpointsQuery } from './developers.queries';

export interface UseWebhookEndpointsResult {
  endpoints: WebhookEndpoint[];
  enabledCount: number;
  /** Endpoints that would receive a given event type. Empty means "nobody is listening". */
  subscribedTo: (type: PublicEventType) => WebhookEndpoint[];
  isLoading: boolean;
  error: Error | null;
}

export function useWebhookEndpoints(): UseWebhookEndpointsResult {
  const registry = useEndpoints();
  const query = useQuery(webhookEndpointsQuery(registry));

  const endpoints = useMemo(() => query.data?.data ?? [], [query.data]);

  const subscribedTo = useCallback(
    (type: PublicEventType) => WebhookEndpointsEndpoint.subscribedTo(endpoints, type),
    [endpoints],
  );

  return {
    endpoints,
    enabledCount: endpoints.filter((endpoint) => endpoint.status === 'enabled').length,
    subscribedTo,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
