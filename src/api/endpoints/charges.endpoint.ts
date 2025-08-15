import type { Charge, ChargeLedgerResponse, ChargeListQuery } from '@payzeno/contracts';

import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/**
 * `GET /v1/charges`, `GET /v1/charges/:chargeId`, `GET /v1/charges/:chargeId/ledger`
 * (api-surface.md §6).
 *
 * `ledger()` landed with arc MIG step 2, when balances and statements moved to the ledger:
 * payzeno-api reads through to `GET /internal/v1/transactions?reference_type=charge`, which
 * is why `ChargeLedgerPanel` can show double-entry detail the legacy biller never had.
 */
export class ChargesEndpoint extends ResourceEndpoint<Charge, ChargeListQuery> {
  protected readonly basePath = '/charges';

  constructor(client: HttpTransport) {
    super(client);
  }

  ledger(chargeId: string): Promise<ChargeLedgerResponse> {
    return this.client.get<ChargeLedgerResponse>(this.resourcePath(chargeId, 'ledger'));
  }

  /**
   * Every charge in one settlement batch. Convenience over `list()` — arc PERF narrowed the
   * default sort here after payzeno-api started seq-scanning (migration 14,
   * `ix_charge_merchant_created`).
   */
  listForBatch(settlementBatchId: string, q?: ChargeListQuery) {
    return this.list({ ...(q ?? {}), settlement_batch_id: settlementBatchId } as ChargeListQuery);
  }
}
