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
