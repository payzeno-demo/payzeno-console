import type { Balance, CurrencyCode } from '@payzeno/contracts';

import type { HttpTransport } from '../transport';

/**
 * `GET /v1/balance` (api-surface.md §8). payzeno-api reads through to the ledger's
 * `GET /internal/v1/balances/:merchantId`.
 *
 * Not a `ResourceEndpoint`: balance is a singleton per (merchant, currency) — there is no
 * list and no id.
 */
export class BalanceEndpoint {
  constructor(private readonly client: HttpTransport) {}

  get(currency: CurrencyCode): Promise<Balance> {
    return this.client.get<Balance>('/balance', { currency });
  }

  /**
   * `negative_balance_minor` is how much the merchant owes Payzeno — refunds and chargebacks
   * have driven `merchant_payable` into a debit balance with no incoming volume to absorb it.
   * It is the primary source of credit loss for an acquirer and the console must show it,
   * which is what `NegativeBalanceAlert` is for.
   */
  static isNegative(balance: Balance): boolean {
    return balance.negative_balance_minor > 0;
  }

  /** Available + pending. What a merchant means when they ask "how much have I got". */
  static totalHeldMinor(balance: Balance): number {
    return balance.available_minor + balance.pending_minor;
  }
}
