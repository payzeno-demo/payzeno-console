/**
 * `useBankAccounts` and `coordinatesOf`.
 *
 * One of only two tests in `features/settings` (blueprint §8.5 — coverage is deliberately thin
 * here, and the team tab has none at all because `useUsers` is still on the legacy fetch path).
 * This one exists because `usePayouts` joins against `accountsById`, so a break here shows up
 * as "Unknown account" on every payout row rather than as a settings bug.
 */
import { describe, expect, it } from 'vitest';

import { coordinatesOf, useBankAccounts } from '@features/settings/useBankAccounts';
import { makeBankAccount, makePage } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('coordinatesOf', () => {
  it('renders a UK sort code, masked', () => {
    expect(coordinatesOf(makeBankAccount())).toBe('Sort code •••• 0417');
  });

  it('renders an IBAN with its BIC', () => {
    const account = makeBankAccount({
      scheme: 'iban',
      iban_last_four: '3391',
      bic: 'DEUTDEFF',
      sort_code_last_four: null,
    });

    expect(coordinatesOf(account)).toBe('IBAN •••• 3391 · DEUTDEFF');
  });

  it('omits the BIC when there is none', () => {
    const account = makeBankAccount({
      scheme: 'iban',
      iban_last_four: '3391',
      bic: null,
      sort_code_last_four: null,
    });

    expect(coordinatesOf(account)).toBe('IBAN •••• 3391');
  });

  it('renders an ABA routing number, masked', () => {
    const account = makeBankAccount({
      scheme: 'aba',
      routing_last_four: '0021',
      sort_code_last_four: null,
    });

    expect(coordinatesOf(account)).toBe('Routing •••• 0021');
  });

  it('never exposes more than the last four of anything', () => {
    const rendered = coordinatesOf(makeBankAccount());

    expect(rendered).toContain('••••');
    expect(rendered).not.toMatch(/\d{5,}/);
  });
});

describe('the list', () => {
  it('reads /v1/bank-accounts', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(2);
    });

    const request = recorder.requests.find((candidate) =>
      candidate.url.includes('/v1/bank-accounts'),
    );
    recorder.stop();

    expect(request?.method).toBe('GET');
  });

  it('annotates each row with its display coordinates', async () => {
    const { result } = renderHookWithProviders(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(2);
    });

    expect(result.current.accounts[0]?._coordinates).toBe('Sort code •••• 0417');
    expect(result.current.accounts[1]?._coordinates).toContain('IBAN');
  });
});

describe('accountsById', () => {
  it('indexes every account by id — this is what usePayouts joins against', async () => {
    const { result } = renderHookWithProviders(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(2);
    });

    expect(result.current.accountsById.size).toBe(2);
    expect(result.current.accountsById.get('ba_01HW0RTBANKACCOUNT0001')?.bank_name).toBe(
      'Northern Counties Bank',
    );
  });

  it('returns undefined for an account that is not in the list', async () => {
    const { result } = renderHookWithProviders(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(2);
    });

    expect(result.current.accountsById.get('ba_from_another_era')).toBeUndefined();
  });
});

describe('defaultFor', () => {
  it('finds the default account for a currency', async () => {
    const { result } = renderHookWithProviders(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(2);
    });

    expect(result.current.defaultFor('GBP')?.id).toBe('ba_01HW0RTBANKACCOUNT0001');
  });

  it('returns undefined for a currency with no default', async () => {
    const { result } = renderHookWithProviders(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(2);
    });

    expect(result.current.defaultFor('EUR')).toBeUndefined();
  });

  it('does not treat a non-default account of the right currency as the default', async () => {
    server.use(
      http.get(url('/bank-accounts'), () =>
        HttpResponse.json(
          makePage([makeBankAccount({ currency: 'USD', is_default: false })]),
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(1);
    });
    expect(result.current.defaultFor('USD')).toBeUndefined();
  });
});

describe('failure', () => {
  it('surfaces the error and keeps the list empty', async () => {
    server.use(errorHandler('get', '/bank-accounts', 500, 'internal_error'));

    const { result } = renderHookWithProviders(() => useBankAccounts());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.accounts).toEqual([]);
    expect(result.current.accountsById.size).toBe(0);
  });
});
