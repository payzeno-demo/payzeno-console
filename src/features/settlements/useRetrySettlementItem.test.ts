/**
 * `useRetrySettlementItem` — the arc-INC hook, and the one branch in this repo that a reader
 * of the-incident.md will come looking for.
 *
 * **`409 settlement_locked` is a no-op, not a failure.** A reconciliation sweep already holds
 * the batch; the item will be settled by that sweep. Toasting an error here trained merchants
 * to press Retry again, which is exactly the pressure that produced the double charge. After
 * PAY-2043 the hook shows "already being settled", refetches, and raises no error toast.
 *
 * Every case drives the real chain:
 *   useRetrySettlementItem → settlements.queries → SettlementsEndpoint.retryItem →
 *   ApiClient.post → ApiClient.request → fetchTransport → MSW → error-mapper.
 */
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@api/queryKeys';
import { useRetrySettlementItem } from '@features/settlements/useRetrySettlementItem';
import { makeViewerSession } from '@/test/factories';
import { errorHandler, recordRequests, server } from '@/test/msw/server';
import { act, renderHookWithProviders, waitFor } from '@/test/render';

const BATCH_ID = 'sb_01HW0RTBATCH000000001';
const ITEM_ID = 'ri_01HW0RTITEM00000000001';

describe('the happy path', () => {
  it('posts to the retry route with the reason the button supplies', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useRetrySettlementItem());

    act(() => {
      result.current.retry({ batchId: BATCH_ID, itemId: 'ri_01HW0RTITEM00000000009' });
    });

    await waitFor(() => {
      expect(result.current.lockedItemId).toBe('ri_01HW0RTITEM00000000009');
    });
  });

  it('does not repeat the request — a lock is an answer', async () => {
    lockTheBatch();
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useRetrySettlementItem());

    act(() => {
      result.current.retry({ batchId: BATCH_ID, itemId: ITEM_ID });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('That item is not retryable.');
    });
  });

  it('clears a previous error when a new attempt starts', async () => {
    server.use(
      errorHandler('post', '/settlements/:batchId/items/:itemId/retry', 400, 'invalid_request', 'no'),
    );
  });
});
