/**
 * `usePayouts`.
 *
 * This hook joins two reads: the payout list, and the bank accounts it needs to render "which
 * account did this land in". `payout.failed` is the one event the console surfaces directly
 * (domain-model.md §9), so `failedCount` is what the page badge and the banner both read.
 */
import { describe, expect, it } from 'vitest';

import { bankLabel, usePayouts } from '@features/payouts/usePayouts';
import { makeBankAccount, makePage, makePayout } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('bankLabel', () => {
  it('names the bank and masks all but the last four', () => {
    expect(bankLabel(makeBankAccount())).toBe('Northern Counties Bank •••• 8812');
  });

  it('says so rather than rendering "undefined" when the account is not loaded', () => {
    expect(bankLabel(undefined)).toBe('Unknown account');
  });

  it('masks even when the account has no last four', () => {
    expect(bankLabel(makeBankAccount({ last_four: '' }))).toContain('••••');
  });
});

describe('the list', () => {
  it('reads /v1/payouts', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => usePayouts());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/v1/payouts'));
    recorder.stop();

    expect(request?.method).toBe('GET');
  });

  it('passes status and currency filters through', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() =>
      usePayouts({ status: 'failed', currency: 'GBP' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/v1/payouts'));
    recorder.stop();

    expect(request?.url).toContain('status=failed');
    expect(request?.url).toContain('currency=GBP');
  });

  it('carries the failure code and the reversal transaction on a failed payout', async () => {
    const { result } = renderHookWithProviders(() => usePayouts());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const failed = result.current.rows.find((row) => row.status === 'failed');
    expect(failed?.failure_code).toBe('bank_rejected');
    expect(failed?.reversal_transaction_id).toBe('txn_01HW0RTLEDGERTXN000009');
  });
});

describe('the bank-account join', () => {
  it('labels each row with its destination account', async () => {
    const { result } = renderHookWithProviders(() => usePayouts());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    await waitFor(() => {
      expect(result.current.rows[0]?._bankLabel).toBe('Northern Counties Bank •••• 8812');
    });
  });

  it('degrades to "Unknown account" when the account is not in the list', async () => {
    server.use(
      http.get(url('/payouts'), () =>
        HttpResponse.json(
          makePage([makePayout({ bank_account_id: 'ba_from_another_era' })]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => usePayouts());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._bankLabel).toBe('Unknown account');
  });

  it('reads the bank accounts as a separate request, not as an expansion', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => usePayouts());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const bankRequests = recorder.requests.filter((candidate) =>
      candidate.url.includes('/v1/bank-accounts'),
    );
    recorder.stop();

    expect(bankRequests.length).toBeGreaterThan(0);
  });
});

describe('failedCount', () => {
  it('counts failed payouts', async () => {
    const { result } = renderHookWithProviders(() => usePayouts());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    expect(result.current.failedCount).toBe(1);
  });

  it('counts returned payouts too — the money came back either way', async () => {
    server.use(
      http.get(url('/payouts'), () =>
        HttpResponse.json(
          makePage([
            makePayout({ id: 'po_a', status: 'returned' }),
            makePayout({ id: 'po_b', status: 'failed' }),
            makePayout({ id: 'po_c', status: 'paid' }),
          ]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => usePayouts());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });
    expect(result.current.failedCount).toBe(2);
  });

  it('is zero for a healthy list', async () => {
    server.use(
      http.get(url('/payouts'), () =>
        HttpResponse.json(makePage([makePayout({ status: 'paid' })])),
      ),
    );

    const { result } = renderHookWithProviders(() => usePayouts());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.failedCount).toBe(0);
  });
});

describe('failure', () => {
  it('surfaces an error and keeps the list empty', async () => {
    server.use(errorHandler('get', '/payouts', 500, 'internal_error'));

    const { result } = renderHookWithProviders(() => usePayouts());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.rows).toEqual([]);
  });
});
