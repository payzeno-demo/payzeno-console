/**
 * `useWebhookEvents(q)` — `GET /v1/webhook_events` (api-surface.md §12).
 *
 * `_health` collapses `status` plus `attempt_count` into the four words a developer actually
 * wants: delivered, pending, failing, dead. "Pending with eleven attempts" is failing, and a
 * table that shows it as pending is why people say the webhooks are fine when they are not.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

import type { Paginated, WebhookEvent } from '@payzeno/contracts';

import type { WebhookEventListQuery } from '@api/endpoints/webhook-events.endpoint';
import { useEndpoints } from '@app/ApiContext';
import { usePagination } from '@hooks/usePagination';
import type { Pagination } from '@hooks/usePagination';
import type { WebhookEventRow } from '@/types/view-models';

import { webhookEventsQuery } from './developers.queries';

/** More than this many attempts and we call it failing regardless of what status says. */
export const FAILING_ATTEMPT_THRESHOLD = 3;

export function healthOf(event: WebhookEvent): WebhookEventRow['_health'] {
  if (event.status === 'dead') return 'dead';
  if (event.status === 'delivered') return 'delivered';
  return event.attempt_count >= FAILING_ATTEMPT_THRESHOLD ? 'failing' : 'pending';
}

export interface UseWebhookEventsResult {
  rows: WebhookEventRow[];
  deadCount: number;
  pagination: Pagination;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export function useWebhookEvents(q?: WebhookEventListQuery): UseWebhookEventsResult {
  const endpoints = useEndpoints();

  // See `useRefunds` — the cursor is an input to the request that produces the page.
  const latest = useRef<Paginated<WebhookEvent> | undefined>(undefined);
  const pagination = usePagination<WebhookEvent>(latest.current, q?.limit);

  const query = useQuery(webhookEventsQuery(endpoints, { ...(q ?? {}), ...pagination.query }));
  latest.current = query.data;

  const rows = useMemo<WebhookEventRow[]>(
    () =>
      (query.data?.data ?? []).map((event) => ({
        ...event,
        _selected: false,
        _health: healthOf(event),
      })),
    [query.data],
  );

  return {
    rows,
    deadCount: rows.filter((row) => row._health === 'dead').length,
    pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
  };
}
