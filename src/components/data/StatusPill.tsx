/**
 * Status pill.
 *
 * The one mapping from a contracts status union to a tone. Every list column and every detail
 * header uses it, so "settled" is the same green everywhere.
 *
 * Colour is never the only cue: the pill always renders the status *text*, and `srPrefix`
 * makes the announcement read "Status: needs response".
 */
import type {
  ChargeStatus,
  DisputeStatus,
  InvoiceStatus,
  PaymentIntentStatus,
  PayoutStatus,
  ReconciliationItemStatus,
  RefundStatus,
  SettlementBatchStatus,
  WebhookEventStatus,
} from '@payzeno/contracts';

import { labelise } from '@lib/format';

import { Badge } from '../ui/Badge';
import type { Tone } from '../ui/tokens';

/**
 * One table, every status union the console renders. Anything unmapped falls through to
 * `neutral` rather than throwing — a new status shipped by the API should look boring, not
 * crash the page.
 */
