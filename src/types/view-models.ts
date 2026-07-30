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
}

export interface ChargeRow extends Charge, RowSelection {
  /** `captured_amount_minor - refunded_amount_minor`, precomputed for the refund dialog. */
  _refundableMinor: number;
  /**
   * Only a captured or settled charge with something left can be refunded. An `authorized`
   * charge takes a *cancel*, which voids the authorisation — a void is not a refund
   * (domain-model.md §4), and the two used to share a button.
   */
  _isRefundable: boolean;
  /** Present once the charge detail page has loaded its ledger view. */
  _ledger?: LedgerTransaction[];
}

export interface PaymentIntentRow extends PaymentIntent, RowSelection {
  /** Manual-capture intent sitting in `requires_capture` — the only shape with a capture button. */
  _isCapturable: boolean;
  /** Cancelling voids the authorisation, so a succeeded intent is past the point of it. */
  _isCancelable: boolean;
  /** `status === 'requires_action'` — drives the `<NextActionCallout />` row accent. */
  _needsCustomerAction: boolean;
}

export interface RefundRow extends Refund, RowSelection {
  /** Denormalised from the parent charge so the table does not need a second query. */
  _chargeLastFour: string | null;
}

export interface DisputeRow extends Dispute, RowSelection {
  /** Hours left before `evidence_due_by`. Negative when the window has closed. */
  _hoursRemaining: number | null;
}

export interface PayoutRow extends Payout, RowSelection {
  /** Resolved from `bank_account_id` against the merchant's accounts. */
  _bankLabel: string;
}

export interface SettlementRow extends MerchantSettlementBatch, RowSelection {
  /**
   * Only a `funded` batch has actually released money. Everything before that is an
   * accounting position, and merchants read the two as the same thing.
   */
  _isFunded: boolean;
  /** `failed` or `partially_reconciled` — the rows the settlements table pulls to the top. */
  _needsAttention: boolean;
}

export interface SettlementItemRow extends ReconciliationItem, RowSelection {
  /** `RetryScheduler.retry_item` will only accept a claim for `retryable` and `failed`. */
  _isRetryable: boolean;
  /**
   * arc INC. A `settled` item that took more than one attempt is where a duplicate `settle`
   * transaction would have come from; this drives `<DuplicateBadge />` on the settlement
   * detail page. PAY-2054's nightly audit checks the same predicate server-side — this is the
   * merchant-visible half, and the two must not drift.
   */
  _isDuplicateSuspect: boolean;
}

export interface InvoiceRow extends Invoice, RowSelection {
  /**
   * `legacy` | `ledger`. Added, removed and re-added during the `ledger_owns_invoices` dry-run
   * (arc MIG). Derived from `migrated_to_ledger`, not sent by the API.
   */
  _source: 'legacy' | 'ledger';
}

export interface ApiKeyRow extends ApiKey, RowSelection {
  /** Set exactly once, immediately after creation. Cleared when `<SecretRevealOnce />` unmounts. */
  _plaintextSecret?: string;
}

export interface WebhookEventRow extends WebhookEvent, RowSelection {
  /** `delivered` / `failing` / `dead`, collapsed from status + attempt_count for the pill. */
  _health: 'delivered' | 'pending' | 'failing' | 'dead';
}

export interface BankAccountRow extends BankAccount, RowSelection {
  /** Whichever of routing/iban/sort-code applies to this account's scheme, pre-formatted. */
  _coordinates: string;
}

export interface TeamMemberRow extends User, RowSelection {
  /** True for the currently signed-in user — the row that cannot be removed. */
  _isSelf: boolean;
}

/** Balance plus the derived view the balance cards actually render. */
export interface BalanceView extends Balance {
  _hasNegative: boolean;
  _byType: ReadonlyMap<BalanceBucket['type'], BalanceBucket>;
}
