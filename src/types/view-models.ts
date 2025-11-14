/**
 * View models.
 *
 * The rule (interfaces.md §4.1): this directory may **extend** a `@payzeno/contracts` type; it
 * may never redeclare one. If you find yourself writing `interface Charge { id: string; … }`
 * here, stop — the field you want already exists upstream, or it belongs on the API.
 *
 * Everything below is "the contract type, plus what the table needs to render it".
 */
import type {
  ApiKey,
  Balance,
  BalanceBucket,
  BankAccount,
  Charge,
  Dispute,
  Invoice,
  LedgerTransaction,
  MerchantSettlementBatch,
  PaymentIntent,
  Payout,
  ReconciliationItem,
  Refund,
  User,
  WebhookEvent,
} from '@payzeno/contracts';

/** Fields every selectable table row carries. */
export interface RowSelection {
  /** Client-side only. Never sent anywhere. */
  _selected: boolean;
