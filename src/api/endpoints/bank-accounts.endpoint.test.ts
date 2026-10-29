/**
 * `BankAccountsEndpoint`.
 *
 * arc PCI lands here on the write side: `create` takes a `bank_account_token`, never an
 * `account_number`. The console cannot send raw bank coordinates because it never has them —
 * `AddBankAccountDialog` posts those straight to the vault. The create case below asserts the
 * request body reaching payzeno-api carries the token and nothing else.
 */
import { describe, expect, it } from 'vitest';

import { HttpResponse, http } from 'msw';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { BankAccountsEndpoint } from '@api/endpoints/bank-accounts.endpoint';
import { ValidationApiError } from '@api/errors';
import { HEADER_IDEMPOTENCY_KEY } from '@api/http/headers';
import { makeBankAccount } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';

function endpoint(): BankAccountsEndpoint {
  return new BankAccountsEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly', () => {
    expect(Object.getPrototypeOf(BankAccountsEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('GET /v1/bank-accounts', () => {
  it('lists accounts across currencies', async () => {
    const page = await endpoint().list();

    expect(page.data.map((account) => account.currency)).toEqual(['GBP', 'EUR']);
  });

  it('exposes only last-four coordinates, never a full account number', async () => {
    const page = await endpoint().list();

    for (const account of page.data) {
      expect(account).not.toHaveProperty('account_number');
      expect(account).not.toHaveProperty('iban');
      expect(account.last_four).toHaveLength(4);
    }
  });

  it('marks exactly one account as the default', async () => {
    const page = await endpoint().list();

    expect(page.data.filter((account) => account.is_default)).toHaveLength(1);
  });
});

describe('GET /v1/bank-accounts/:bankAccountId', () => {
  it('reads one account by id', async () => {
    const account = await endpoint().get('ba_01HW0RTBANKACCOUNT0001');

    expect(account.id).toBe('ba_01HW0RTBANKACCOUNT0001');
    expect(account.scheme).toBe('uk_sort_code');
  });
});

describe('POST /v1/bank-accounts', () => {
  it('creates an account from a vault token, not from raw coordinates (arc PCI)', async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(url('/bank-accounts'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeBankAccount({ id: 'ba_new', status: 'new' }), {
          status: 201,
        });
      }),
    );

    const account = await endpoint().create({
      bank_account_token: 'bat_01HW0RTBANKTOKEN00001',
      currency: 'GBP',
      country: 'GB',
      scheme: 'uk_sort_code',
      account_holder_name: 'Northwind Trading Ltd',
    });

    expect(body.bank_account_token).toBe('bat_01HW0RTBANKTOKEN00001');
    expect(body).not.toHaveProperty('account_number');
    expect(body).not.toHaveProperty('iban');
    expect(account.id).toBe('ba_new');
  });

  it('comes back in a pre-validated state — micro-deposits have not run yet', async () => {
    const account = await endpoint().create({
      bank_account_token: 'bat_1',
      currency: 'EUR',
      country: 'DE',
      scheme: 'iban',
      account_holder_name: 'Northwind Trading GmbH',
    });

    expect(account.status).toBe('new');
    expect(account.is_default).toBe(false);
  });

  it('sends an idempotency key on the create', async () => {
    const recorder = recordRequests();
    await endpoint().create({
      bank_account_token: 'bat_1',
      currency: 'GBP',
      country: 'GB',
      scheme: 'uk_sort_code',
      account_holder_name: 'Northwind Trading Ltd',
    });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBeTruthy();
  });

  it('surfaces a rejected token as a ValidationApiError', async () => {
    server.use(
      errorHandler('post', '/bank-accounts', 422, 'validation_failed', 'That token has expired.'),
    );

    await expect(
      endpoint().create({
        bank_account_token: 'bat_expired',
        currency: 'GBP',
        country: 'GB',
        scheme: 'uk_sort_code',
        account_holder_name: 'Northwind Trading Ltd',
      }),
    ).rejects.toBeInstanceOf(ValidationApiError);
  });
});

describe('POST /v1/bank-accounts/:bankAccountId/default', () => {
  it('posts an empty body to the default sub-path', async () => {
    server.use(
      http.post(url('/bank-accounts/:bankAccountId/default'), ({ params }) =>
        HttpResponse.json(
          makeBankAccount({ id: String(params.bankAccountId), is_default: true }),
        ),
      ),
    );

    const recorder = recordRequests();
    const account = await endpoint().makeDefault('ba_01HW0RTBANKACCOUNT0002');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toBe(
      'http://localhost/v1/bank-accounts/ba_01HW0RTBANKACCOUNT0002/default',
    );
    expect(account.is_default).toBe(true);
  });
});
