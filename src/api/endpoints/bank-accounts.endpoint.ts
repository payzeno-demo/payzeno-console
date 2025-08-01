import type { BankAccount, CreateBankAccountRequest, ListQuery } from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/**
 * `GET /v1/bank-accounts`, `GET /v1/bank-accounts/:bankAccountId`,
 * `POST /v1/bank-accounts`, `POST /v1/bank-accounts/:bankAccountId/default`
 * (api-surface.md §4).
 *
 * arc PCI: `CreateBankAccountRequest` carries a `bank_account_token` (`bat_…`) obtained by
 * the browser from the vault's public origin. Payzeno never receives an account number in
 * the clear — a 9-digit ABA routing number is not Luhn-valid and the PAN redaction rule
 * never caught it, so raw numbers used to land in structured request logs.
 */
export class BankAccountsEndpoint extends ResourceEndpoint<BankAccount, ListQuery> {
  protected readonly basePath = '/bank-accounts';

  constructor(client: HttpTransport) {
    super(client);
  }

  create(
    req: CreateBankAccountRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<BankAccount> {
    return this.client.post<BankAccount, CreateBankAccountRequest>(
      this.basePath,
      req,
      idempotencyKey,
    );
  }

  /** Payouts default to the `is_default` account **for the payout's currency**. */
  makeDefault(
    bankAccountId: string,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<BankAccount> {
    return this.client.post<BankAccount, Record<string, never>>(
      this.resourcePath(bankAccountId, 'default'),
      {},
      idempotencyKey,
    );
  }
}
