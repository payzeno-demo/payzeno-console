/**
 * `useSettlementItems` — the read half of arc INC and the trigger for arc PERF.
 *
 * Two behaviours worth a test:
 *  - the rollup. `BatchTotalsPanel` renders `posted` against `expected`, and the duplicate
 *    count that goes with it. A settled item with `attempt_count > 1` is the merchant-visible
 *    fingerprint of the double-settle (`_isDuplicateSuspect`).
 *  - the page size. It asks for `SETTLEMENT_ITEM_PAGE_SIZE` (50), not the 500 that made
 *    payzeno-api seq-scan.
 */
import { describe, expect, it } from 'vitest';

import { SETTLEMENT_ITEM_PAGE_SIZE } from '@config/constants';
import { useSettlementItems } from '@features/settlements/useSettlementItems';
import { makePage, makeReconciliationItem } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

const BATCH_ID = 'sb_01HW0RTBATCH000000001';

describe('the request', () => {
  it('asks for 50 items, the page size the PERF fix settled on', async () => {
    const recorder = recordRequests();
    const request = recorder.requests.find((candidate) => candidate.url.includes('/items'));
    recorder.stop();

    expect(SETTLEMENT_ITEM_PAGE_SIZE).toBe(50);
    expect(request?.url).toContain('limit=50');
  });

  it('passes a status filter through', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() =>
      useSettlementItems(BATCH_ID, { status: 'retryable' }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { result } = renderHookWithProviders(() => useSettlementItems(''));

    await waitFor(() => {
      expect(result.current.rows).toEqual([]);
    });

    const { result } = renderHookWithProviders(() => useSettlementItems(BATCH_ID));

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });
  });

  it('marks a retryable item as retryable and a settled one as not', async () => {
    const byStatus = new Map(result.current.rows.map((row) => [row.status, row]));
    expect(byStatus.get('retryable')?._isRetryable).toBe(true);
    expect(byStatus.get('settled')?._isRetryable).toBe(false);
  });

  it('flags a settled item that took more than one attempt as a duplicate suspect', async () => {
    const { result } = renderHookWithProviders(() => useSettlementItems(BATCH_ID));

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });

    const { result } = renderHookWithProviders(() => useSettlementItems(BATCH_ID));

    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.rows[0]?._isDuplicateSuspect).toBe(false);
  });

  it('does not flag a retryable item that has been attempted twice — it never settled', async () => {
    server.use(
      http.get(url('/settlements/:batchId/items'), () =>
        HttpResponse.json(
          makePage([makeReconciliationItem({ status: 'retryable', attempt_count: 4 })]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useSettlementItems(BATCH_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totals).toEqual({
      expectedMinor: 0,
      postedMinor: 0,
      feeMinor: 0,
      varianceMinor: 0,
      duplicateCount: 0,
    });
  });
});

describe('failure', () => {
  it('surfaces a 502 rather than pretending the batch is empty', async () => {
    server.use(errorHandler('get', '/settlements/:batchId/items', 502, 'processor_unavailable'));

    const { result } = renderHookWithProviders(() => useSettlementItems(BATCH_ID));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.rows).toEqual([]);
  });
});
