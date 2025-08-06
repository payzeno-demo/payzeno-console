/**
 * `useWebhookEvent(id)` — `GET /v1/webhook_events/:eventId` (api-surface.md §12).
 *
 * Also owns redelivery. `source_event_id` is the bus envelope id the event was fanned out
 * from, and the dedupe key is `(endpoint_id, source_event_id)` — which is why redelivering a
 * `payout.failed` does not send the merchant a second, different webhook: it retries the same
 * one.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { WebhookEvent } from '@payzeno/contracts';

import { ConsoleApiError, ForbiddenError, NotFoundApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { healthOf } from './useWebhookEvents';
import { redeliverWebhookEventMutation, webhookEventQuery } from './developers.queries';

export interface UseWebhookEventResult {
  event: WebhookEvent | undefined;
  health: 'delivered' | 'pending' | 'failing' | 'dead' | undefined;
  canRedeliver: boolean;
  redeliver: () => void;
  isRedelivering: boolean;
  isLoading: boolean;
  isMissing: boolean;
  error: Error | null;
  actionError: string | null;
}

export function useWebhookEvent(eventId: string): UseWebhookEventResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery(webhookEventQuery(endpoints, eventId));
  const event = query.data;
  const isMissing = query.error instanceof NotFoundApiError;

  const mutation = useMutation({
    ...redeliverWebhookEventMutation(endpoints),
    onSuccess: async (updated: WebhookEvent) => {
      toast.success('Redelivery queued.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.webhookEvents.detail(updated.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.webhookEvents.all }),
      ]);
    },
    onError: (error: unknown) => {
      if (error instanceof ForbiddenError) {
        setActionError('Redelivering an event needs an admin role.');
        return;
      }
      setActionError(
        error instanceof ConsoleApiError ? error.message : 'The redelivery could not be queued.',
      );
    },
  });

  const redeliver = useCallback(() => {
    if (!event) return;
    setActionError(null);
    mutation.mutate({ eventId: event.id });
  }, [event, mutation]);

  return {
    event,
    health: event ? healthOf(event) : undefined,
    // A delivered event can still be redelivered — that is how you replay into a new consumer.
    canRedeliver: event !== undefined,
    redeliver,
    isRedelivering: mutation.isPending,
    isLoading: query.isLoading,
    isMissing,
    error: isMissing ? null : ((query.error as Error | null) ?? null),
    actionError,
  };
}
