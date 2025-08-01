import type {
  CreatePayoutRequest,
  CurrencyCode,
  ListQuery,
  Payout,
  PayoutResponse,
  PayoutStatus,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

export interface PayoutListQuery extends ListQuery {
  status?: PayoutStatus;
  currency?: CurrencyCode;
}

/**
 * `GET /v1/payouts`, `GET /v1/payouts/:payoutId`, `POST /v1/payouts`,
 * `POST /v1/payouts/:payoutId/cancel` (api-surface.md §8). Every one of these reads or
 * writes through to payzeno-ledger's `/internal/v1/payouts*`.
 *
 * Create and cancel are `admin` — `RequireRole` gates the UI, `RolesGuard` gates the API,
 * and `useCreatePayout` still has to render the 403 because the two can disagree.
 */
export class PayoutsEndpoint extends ResourceEndpoint<Payout, PayoutListQuery> {
  protected readonly basePath = '/payouts';

  listFailed(currency?: CurrencyCode) {
    return this.list({ status: 'failed', currency, limit: 20 });
  }
}
