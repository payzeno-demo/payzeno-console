/**
 * `useWebhookEvents` and `healthOf`.
 *
 * The health derivation is what turns a delivery log into something a developer can triage:
 * `dead` means Payzeno has stopped trying, and three or more attempts means their endpoint is
 * flapping even though a delivery eventually landed.
 */
import { describe, expect, it } from 'vitest';

import {
  FAILING_ATTEMPT_THRESHOLD,
  healthOf,
  useWebhookEvents,
} from '@features/developers/useWebhookEvents';
import { makePage, makeWebhookEvent } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('healthOf', () => {
  it('calls a delivered first-attempt event healthy', () => {
    expect(healthOf(makeWebhookEvent({ status: 'delivered', attempt_count: 1 }))).toBe('healthy');
  });

  it('calls a dead event dead, whatever its attempt count', () => {
    expect(healthOf(makeWebhookEvent({ status: 'dead', attempt_count: 1 }))).toBe('dead');
  });

  it('calls a many-attempt delivery failing', () => {
    expect(
      healthOf(makeWebhookEvent({ status: 'delivered', attempt_count: FAILING_ATTEMPT_THRESHOLD })),
    ).toBe('failing');
  });

  it('uses a threshold of three attempts', () => {
    expect(FAILING_ATTEMPT_THRESHOLD).toBe(3);
    expect(healthOf(makeWebhookEvent({ status: 'delivered', attempt_count: 2 }))).toBe('healthy');
  });
});

describe('the list', () => {
  it('reads /v1/webhook_events', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/v1/webhook_events'),
    );
    recorder.stop();

    expect(request?.method).toBe('GET');
  });

  it('passes a status and a type filter through', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() =>
      useWebhookEvents({ status: 'dead', type: 'payout.failed' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/v1/webhook_events'),
    );
    recorder.stop();

    expect(request?.url).toContain('status=dead');
    expect(request?.url).toContain('type=payout.failed');
  });

  it('annotates each row with its health', async () => {
    const { result } = renderHookWithProviders(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const byStatus = new Map(result.current.rows.map((row) => [row.status, row]));
    expect(byStatus.get('delivered')?._health).toBe('healthy');
    expect(byStatus.get('dead')?._health).toBe('dead');
  });

  it('carries the last response status and error, which is the whole point of the log', async () => {
    const { result } = renderHookWithProviders(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const dead = result.current.rows.find((row) => row.status === 'dead');
    expect(dead?.last_response_status).toBe(500);
    expect(dead?.last_error).toBe('connect ETIMEDOUT');
  });

  it('handles an empty log without throwing', async () => {
    server.use(http.get(url('/webhook_events'), () => HttpResponse.json(makePage([]))));

    const { result } = renderHookWithProviders(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rows).toEqual([]);
  });
});

describe('failure', () => {
  it('surfaces the error and keeps the list empty', async () => {
    server.use(errorHandler('get', '/webhook_events', 500, 'internal_error'));

    const { result } = renderHookWithProviders(() => useWebhookEvents());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.rows).toEqual([]);
  });
});
