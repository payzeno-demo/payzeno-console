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
