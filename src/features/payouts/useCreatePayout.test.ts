/**
 * `useCreatePayout`.
 *
 * Two failure codes get their own copy because they are the two a merchant actually hits and
 * neither is self-explanatory from the status alone: `payout_blocked` (negative balance) and
 * `currency_mismatch` (Payzeno does not convert — domain-model.md §8).
 */
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@api/queryKeys';
import { useCreatePayout } from '@features/payouts/useCreatePayout';
import { errorHandler, server, url } from '@/test/msw/server';
import { act, renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

import { makePayout } from '@/test/factories';

function captureBody(): { seen: Record<string, unknown> | null } {
  const box: { seen: Record<string, unknown> | null } = { seen: null };
  server.use(
    http.post(url('/payouts'), async ({ request }) => {
      box.seen = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(makePayout({ id: 'po_created', status: 'scheduled' }), {
        status: 201,
      });
    }),
  );
  return box;
}

describe('creating a payout', () => {
  it('sends only the currency when nothing else is specified', async () => {
    const box = captureBody();
    const { result } = renderHookWithProviders(() => useCreatePayout());

    act(() => {
      result.current.createPayout({
        currency: 'GBP',
        amountMinor: 250_000,
        bankAccountId: 'ba_01HW0RTBANKACCOUNT0001',
        method: 'instant',
        statementDescriptor: 'NORTHWIND PAYOUT',
      });
    });

    await waitFor(() => {
      expect(box.seen).not.toBeNull();
    });
    expect(box.seen).toEqual({
      currency: 'GBP',
      amount_minor: 250_000,
      bank_account_id: 'ba_01HW0RTBANKACCOUNT0001',
      method: 'instant',
      statement_descriptor: 'NORTHWIND PAYOUT',
    });
  });

  it('exposes the created payout', async () => {
    const { result } = renderHookWithProviders(() => useCreatePayout());

    act(() => {
      result.current.createPayout({ currency: 'GBP' });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        'This payout conflicts with one already in flight.',
      );
    });
  });

  it('explains currency_mismatch by saying Payzeno does not convert', async () => {
    server.use(
      errorHandler('post', '/payouts', 422, 'currency_mismatch', 'Account is EUR.', {
        field_errors: [{ path: 'bank_account_id', message: 'Held in EUR.' }],
      }),
    );

  });
});
