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
const TONE_BY_STATUS: Readonly<Record<string, Tone>> = {
  // payment intent
  requires_payment_method: 'neutral',
  requires_confirmation: 'neutral',
  processing: 'info',
  requires_action: 'warning',
  requires_capture: 'warning',
  succeeded: 'success',
  canceled: 'neutral',

  // charge
  pending: 'neutral',
  authorized: 'info',
  captured: 'info',
  settled: 'success',
  failed: 'danger',
  voided: 'neutral',
  expired: 'neutral',
  reversed: 'warning',

  // refund
  // (pending / succeeded / failed / canceled covered above)

  // dispute
  needs_response: 'danger',
  under_review: 'warning',
  won: 'success',
  lost: 'danger',
  warning_needs_response: 'warning',
  warning_closed: 'neutral',

  // payout
  scheduled: 'neutral',
  in_transit: 'info',
  paid: 'success',
  returned: 'danger',

  // settlement batch
  open: 'neutral',
  closed: 'neutral',
  reconciling: 'info',
  reconciled: 'success',
  partially_reconciled: 'warning',
  funded: 'success',

  // reconciliation item
  settling: 'info',
  retryable: 'warning',
  orphaned: 'danger',
  needs_review: 'warning',
  variance_exceeded: 'danger',

  // webhook event
  delivering: 'info',
  delivered: 'success',
  dead: 'danger',

  // invoice
  draft: 'neutral',
  uncollectible: 'danger',
  void: 'neutral',
