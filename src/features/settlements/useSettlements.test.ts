/**
 * `useSettlements` — the batch list.
 *
 * The two derived flags are the whole point of the hook. `_isFunded` distinguishes money that
 * has actually left the acquirer from an accounting position, which merchants read as the same
 * thing and are wrong about roughly weekly. `_needsAttention` is what drives the row emphasis.
 */
import { describe, expect, it } from 'vitest';

import { useSettlements } from '@features/settlements/useSettlements';
import { makePage, makeSettlementBatch } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('the request', () => {
  it('lists batches at the frozen path', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useSettlements());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/v1/settlements'),
    );
    recorder.stop();

    expect(request?.method).toBe('GET');
  });

  it('passes the currency and status filters through', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() =>
      useSettlements({ currency: 'GBP', status: 'funded' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/v1/settlements'),
    );
    recorder.stop();

    expect(request?.url).toContain('currency=GBP');
    expect(request?.url).toContain('status=funded');
  });
});

describe('the derived flags', () => {
  it('marks only a funded batch as funded', async () => {
    const { result } = renderHookWithProviders(() => useSettlements());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const byStatus = new Map(result.current.rows.map((row) => [row.status, row]));
    expect(byStatus.get('funded')?._isFunded).toBe(true);
    expect(byStatus.get('partially_reconciled')?._isFunded).toBe(false);
  });

  it('flags a partially reconciled batch as needing attention', async () => {
    const { result } = renderHookWithProviders(() => useSettlements());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const partial = result.current.rows.find((row) => row.status === 'partially_reconciled');
    expect(partial?._needsAttention).toBe(true);
  });

  it('flags a failed batch as needing attention', async () => {
    server.use(
      http.get(url('/settlements'), () =>
        HttpResponse.json(makePage([makeSettlementBatch({ status: 'failed' })])),
      ),
    );

    const { result } = renderHookWithProviders(() => useSettlements());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._needsAttention).toBe(true);
  });

  it('leaves a reconciled batch alone', async () => {
    server.use(
      http.get(url('/settlements'), () =>
        HttpResponse.json(makePage([makeSettlementBatch({ status: 'reconciled' })])),
      ),
    );

    const { result } = renderHookWithProviders(() => useSettlements());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._needsAttention).toBe(false);
    expect(result.current.rows[0]?._isFunded).toBe(false);
  });

  it('carries the contract fields through untouched', async () => {
    const { result } = renderHookWithProviders(() => useSettlements());

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });

    const first = result.current.rows[0];
    expect(first?.acquirer).toBe('worldflow');
    expect(first?.net_minor).toBe(36_120);
    expect(first?.processing_date).toBe('2026-03-13');
  });
});

describe('pagination signals', () => {
  it('reports no more pages when the envelope says so', async () => {
    const { result } = renderHookWithProviders(() => useSettlements());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);
    expect(result.current.nextCursor).toBeNull();
  });

  it('surfaces the cursor when there is another page', async () => {
    server.use(
      http.get(url('/settlements'), () =>
        HttpResponse.json(makePage([makeSettlementBatch()], true)),
      ),
    );

    const { result } = renderHookWithProviders(() => useSettlements());

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });
    expect(result.current.nextCursor).toBe('cur_next_page_opaque');
  });
});

describe('failure', () => {
  it('surfaces the error and keeps the row list empty', async () => {
    server.use(errorHandler('get', '/settlements', 500, 'internal_error'));

    const { result } = renderHookWithProviders(() => useSettlements());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.rows).toEqual([]);
  });
});
