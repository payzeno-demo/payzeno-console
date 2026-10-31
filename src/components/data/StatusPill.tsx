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
  BankAccountStatus,
  ChargeStatus,
  DisputeStatus,
  InvoiceStatus,
  OnboardingState,
  PaymentIntentStatus,
  PayoutStatus,
  ReconciliationItemStatus,
  RefundStatus,
  ReviewStatus,
  SettlementBatchStatus,
  SubscriptionStatus,
  WebhookEventStatus,
} from '@payzeno/contracts';

import { labelise } from '@lib/format';
import type { WebhookEventRow } from '@/types/view-models';

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

  // subscription (RFC platform-v2 §6) — `canceled` covered above
  active: 'success',
  past_due: 'warning',

  // risk review (§8) — `open` is the settlement-batch neutral above; a held payment's own
  // badge says "Held for review" in words, so the review pill does not need to shout.
  approved: 'success',
  declined: 'danger',

  // onboarding (§3) — `approved` covered above
  collecting: 'neutral',
  submitted: 'info',
  needs_info: 'warning',
  rejected: 'danger',
};

export type AnyStatus =
  | PaymentIntentStatus
  | ChargeStatus
  | RefundStatus
  | DisputeStatus
  | PayoutStatus
  | SettlementBatchStatus
  | ReconciliationItemStatus
  | WebhookEventStatus
  | InvoiceStatus
  | BankAccountStatus
  | SubscriptionStatus
  | ReviewStatus
  | OnboardingState
  /** Console-derived: `WebhookEventStatus` plus `failing`, collapsed for exactly this pill. */
  | WebhookEventRow['_health'];

/** Exported for the chart theme and for `settlement-items.columns.tsx`'s row accent. */
export function toneForStatus(status: string): Tone {
  return TONE_BY_STATUS[status] ?? 'neutral';
}

export interface StatusPillProps {
  status: AnyStatus;
  /** What the status describes — "Payout status". Announced before the value. */
  srPrefix?: string;
  size?: 'sm' | 'md';
  /**
   * Display text. Defaults to `labelise(status)`, which is right almost everywhere; the
   * override exists for the two places that want domain wording rather than the enum
   * ("Awaiting evidence" for `needs_response`).
   */
  label?: string;
  /**
   * What the status means, as a native hover hint ("Authorised. Capture to take the money.").
   * Supplementary only — the same explanation has to be reachable as text somewhere else,
   * usually the detail page.
   */
  title?: string;
}

export function StatusPill({
  status,
  srPrefix = 'Status',
  size = 'md',
  label,
  title,
}: StatusPillProps) {
  return (
    <Badge
      tone={toneForStatus(status)}
      size={size}
      srPrefix={srPrefix}
      title={title || undefined}
      withDot
    >
      {label ?? labelise(status)}
    </Badge>
  );
}

/** `exportValue` counterpart — the raw enum value, which is what a spreadsheet wants. */
export function statusExportValue(status: AnyStatus): string {
  return status;
}
