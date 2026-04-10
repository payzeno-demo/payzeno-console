/**
 * `useChargeLedger` — the double-entry view arc MIG step 2 made possible.
 *
 * `hasDuplicateSettlement` is the console-side detector for the incident: two `settle`
 * transactions against one charge means the same acquirer line posted twice. The legacy biller
 * could not have shown this at all, which is a large part of why the ledger exists.
 */
import { describe, expect, it } from 'vitest';

import { useChargeLedger } from '@features/charges/useChargeLedger';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

const CHARGE_ID = 'ch_01HW0RTCHARGE00000001';

function transaction(id: string, purpose: string) {
  return {
    id,
    object: 'ledger_transaction',
    purpose,
    currency: 'GBP',
    entries: [],
    posted_at: '2026-03-14T08:02:01.000Z',
  };
}

function ledgerReturning(...purposes: string[]): void {
  server.use(
    http.get(url('/charges/:chargeId/ledger'), ({ params }) =>
      HttpResponse.json({
        charge_id: String(params.chargeId),
        transactions: purposes.map((purpose, index) =>
          transaction(`txn_${index}`, purpose),
        ),
      }),
    ),
  );
}

describe('the request', () => {
  it('reads the ledger sub-path for the charge', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const request = recorder.requests.find((candidate) => candidate.url.includes('/ledger'));
    recorder.stop();

    expect(request?.url).toBe(`http://localhost/v1/charges/${CHARGE_ID}/ledger`);
  });

  it('does not fire without a charge id', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useChargeLedger(''));

    await waitFor(() => {
      expect(result.current.transactions).toEqual([]);
    });

    const requests = recorder.requests.filter((candidate) => candidate.url.includes('/ledger'));
    recorder.stop();

    expect(requests).toHaveLength(0);
  });
});

describe('the transactions', () => {
  it('returns them in the order the ledger posted them', async () => {
    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    expect(result.current.transactions.map((t) => t.purpose)).toEqual(['authorize', 'capture']);
  });

  it('returns an empty list rather than undefined before the read resolves', () => {
    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    expect(result.current.transactions).toEqual([]);
  });
});

describe('grouping by purpose', () => {
  it('produces one group per distinct purpose', async () => {
    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2);
    });

    expect(result.current.groups.map((group) => group.purpose)).toEqual([
      'authorize',
      'capture',
    ]);
  });

  it('collects repeated purposes into one group', async () => {
    ledgerReturning('authorize', 'capture', 'settle', 'settle');

    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(3);
    });

    const settle = result.current.groups.find((group) => group.purpose === 'settle');
    expect(settle?.transactions).toHaveLength(2);
  });

  it('produces no groups for an empty ledger', async () => {
    ledgerReturning();

    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.groups).toEqual([]);
  });
});

describe('hasDuplicateSettlement — the arc-INC detector', () => {
  it('is false for a healthy authorize/capture/settle charge', async () => {
    ledgerReturning('authorize', 'capture', 'settle');

    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(3);
    });
    expect(result.current.hasDuplicateSettlement).toBe(false);
  });

  it('is true when the same charge settled twice', async () => {
    ledgerReturning('authorize', 'capture', 'settle', 'settle');

    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(4);
    });
    expect(result.current.hasDuplicateSettlement).toBe(true);
  });

  it('is not confused by two captures — only `settle` counts', async () => {
    ledgerReturning('authorize', 'capture', 'capture', 'settle');

    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(4);
    });
    expect(result.current.hasDuplicateSettlement).toBe(false);
  });

  it('is false before anything has loaded', () => {
    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    expect(result.current.hasDuplicateSettlement).toBe(false);
  });
});

describe('failure', () => {
  it('surfaces a ledger outage rather than showing an empty posting list', async () => {
    server.use(errorHandler('get', '/charges/:chargeId/ledger', 502, 'processor_unavailable'));

    const { result } = renderHookWithProviders(() => useChargeLedger(CHARGE_ID));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.transactions).toEqual([]);
  });
});
