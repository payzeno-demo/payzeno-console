/**
 * `useSubmitEvidence`.
 *
 * Two outcomes that look similar and are not: a **draft save** (`submit: false`) keeps the
 * dispute editable, while a **submission** (`submit: true`) is irreversible — the packet has
 * gone to the card network. And `dispute_window_closed` gets its own branch because it means
 * the merchant's evidence will never be seen, which is worth saying plainly rather than as a
 * field error.
 */
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@api/queryKeys';
import { useSubmitEvidence } from '@features/disputes/useSubmitEvidence';
import { errorHandler, server, url } from '@/test/msw/server';
import { act, renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

import { makeDispute } from '@/test/factories';

const DISPUTE_ID = 'dp_01HW0RTDISPUTE00000001';

const EVIDENCE = {
  product_description: 'One case of Northwind Assam, shipped 2 March.',
  shipping_tracking_number: 'RM123456789GB',
};

function captureBody(): { seen: Record<string, unknown> | null } {
  const box: { seen: Record<string, unknown> | null } = { seen: null };
  server.use(
    http.post(url('/disputes/:disputeId/evidence'), async ({ request, params }) => {
      box.seen = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(
        makeDispute({ id: String(params.disputeId), status: 'under_review' }),
      );
    }),
  );
  return box;
}

describe('saving a draft', () => {
  it('sends submit: false with the evidence', async () => {
    const box = captureBody();
    const { result } = renderHookWithProviders(() => useSubmitEvidence());

    act(() => {
      result.current.submitEvidence({ disputeId: DISPUTE_ID, evidence: EVIDENCE, submit: true });
    });

    await waitFor(() => {
      expect(box.seen).not.toBeNull();
    });
    expect(box.seen).toMatchObject({ submit: true });
  });

  it('marks the dispute submitted, which is what locks the form', async () => {
    const { result } = renderHookWithProviders(() => useSubmitEvidence());

    act(() => {
      result.current.submitEvidence({ disputeId: DISPUTE_ID, evidence: EVIDENCE, submit: true });
    });

    await waitFor(() => {
      expect(result.current.isSubmitted).toBe(true);
    });
  });

  it('invalidates the dispute and the dispute list', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useSubmitEvidence());

    queryClient.setQueryData(queryKeys.disputes.detail(DISPUTE_ID), { id: DISPUTE_ID });

    act(() => {
      result.current.submitEvidence({ disputeId: DISPUTE_ID, evidence: EVIDENCE, submit: true });
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(queryKeys.disputes.detail(DISPUTE_ID))?.isInvalidated,
      ).toBe(true);
    });
  });
});

describe('the closed-window branch', () => {
  it('sets windowClosed rather than showing a field error', async () => {
    server.use(
      errorHandler(
        'post',
        '/disputes/:disputeId/evidence',
        422,
        'dispute_window_closed',
        'Too late.',
      ),
    );

    const { result } = renderHookWithProviders(() => useSubmitEvidence());

    act(() => {
      result.current.submitEvidence({ disputeId: DISPUTE_ID, evidence: EVIDENCE, submit: true });
    });

    await waitFor(() => {
      expect(result.current.windowClosed).toBe(true);
    });

    expect(result.current.errorMessage).toBe(
      'The response window closed before this reached the network.',
    );
    expect(result.current.fieldErrors).toEqual({});
  });

  it('refetches the dispute, so the page shows the state the network left it in', async () => {
    server.use(
      errorHandler('post', '/disputes/:disputeId/evidence', 422, 'dispute_window_closed', 'Late'),
    );

    const { result } = renderHookWithProviders(() => useSubmitEvidence());

    act(() => {
      result.current.submitEvidence({ disputeId: DISPUTE_ID, evidence: EVIDENCE, submit: true });
    });

    await waitFor(() => {
      expect(result.current.fieldErrors).toEqual({
        'evidence.customer_email': 'Not a valid email address.',
      });
    });
    expect(result.current.errorMessage).toBe('Some of the evidence fields need attention.');
    expect(result.current.windowClosed).toBe(false);
  });

  it('names the permission on a 403', async () => {
    server.use(errorHandler('post', '/disputes/:disputeId/evidence', 403, 'permission_denied'));

  });
});
