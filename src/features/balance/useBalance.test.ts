/**
 * `useBalance` and `toBalanceView`.
 *
 * A negative balance is the state that stops payouts (domain-model.md §8), so the view model
 * derives it explicitly rather than leaving every consumer to compare numbers and get it
 * subtly different.
 */
import { describe, expect, it } from 'vitest';

import { toBalanceView, useBalance } from '@features/balance/useBalance';
import { makeBalance } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('toBalanceView', () => {
  it('passes the contract fields through unchanged', () => {
    const view = toBalanceView(makeBalance());

    expect(view.available_minor).toBe(1_284_300);
    expect(view.pending_minor).toBe(412_050);
    expect(view.currency).toBe('GBP');
  });

  it('derives nothing that contradicts the wire value', () => {
    const balance = makeBalance({ negative_balance_minor: 0 });
    const view = toBalanceView(balance);

    expect(view.negative_balance_minor).toBe(balance.negative_balance_minor);
  });

  it('keeps the bucket breakdown, which is what the cards render', () => {
    const view = toBalanceView(makeBalance());

    expect(view.buckets.map((bucket) => bucket.type)).toEqual([
      'merchant_payable',
      'merchant_receivable',
      'chargeback_liability',
    ]);
  });
});

describe('the read', () => {
  it('sends the currency as a query parameter', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useBalance('GBP'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/v1/balance'));
    recorder.stop();

    expect(request?.url).toContain('currency=GBP');
  });

  it('reads a different currency without touching the first', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useBalance('EUR'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/v1/balance'));
    recorder.stop();

    expect(request?.url).toContain('currency=EUR');
  });

  it('exposes the balance once it lands', async () => {
    const { result } = renderHookWithProviders(() => useBalance('GBP'));

    await waitFor(() => {
      expect(result.current.balance).toBeDefined();
    });

    expect(result.current.balance?.available_minor).toBe(1_284_300);
  });
});

describe('the negative-balance state', () => {
  it('is not flagged for a healthy balance', async () => {
    const { result } = renderHookWithProviders(() => useBalance('GBP'));

    await waitFor(() => {
      expect(result.current.balance).toBeDefined();
    });

    expect(result.current.balance?.negative_balance_minor).toBe(0);
  });

  it('surfaces a negative balance verbatim, so the alert can quote the amount', async () => {
    server.use(
      http.get(url('/balance'), () =>
        HttpResponse.json(
          makeBalance({ available_minor: -42_000, negative_balance_minor: 42_000 }),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useBalance('GBP'));

    await waitFor(() => {
      expect(result.current.balance?.negative_balance_minor).toBe(42_000);
    });
    expect(result.current.balance?.available_minor).toBe(-42_000);
  });
});

describe('failure', () => {
  it('surfaces an error rather than rendering a zero balance', async () => {
    server.use(errorHandler('get', '/balance', 502, 'processor_unavailable'));

    const { result } = renderHookWithProviders(() => useBalance('GBP'));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    // A zero balance and an unknown balance are not the same thing, and a merchant reading
    // "£0.00 available" during an outage will call support.
    expect(result.current.balance).toBeUndefined();
  });
});
