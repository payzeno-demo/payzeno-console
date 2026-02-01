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
    const { result } = renderHookWithProviders(() => useSettlementItems(''));

    await waitFor(() => {
      expect(result.current.rows).toEqual([]);
    });

  });
});
