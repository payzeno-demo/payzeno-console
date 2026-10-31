/**
 * Words for recurring billing. Pure functions: the columns, the dialogs and the customer page
 * all describe a cadence the same way.
 */
import type { Recurring, Subscription, SubscriptionStatus } from '@payzeno/contracts';

/** `{ month, 1 }` → "every month"; `{ month, 3 }` → "every 3 months"; null → "one-off". */
export function cadenceLabel(recurring: Recurring | null): string {
  if (!recurring) return 'one-off';
  if (recurring.interval_count === 1) return `every ${recurring.interval}`;
  return `every ${recurring.interval_count} ${recurring.interval}s`;
}

/** "/month", "/3 months" — the suffix after an amount. Empty for one-off. */
export function perCadence(recurring: Recurring | null): string {
  if (!recurring) return '';
  if (recurring.interval_count === 1) return `/${recurring.interval}`;
  return `/${recurring.interval_count} ${recurring.interval}s`;
}

export const SUBSCRIPTION_STATUS_LABELS: Readonly<Record<SubscriptionStatus, string>> = {
  active: 'Active',
  past_due: 'Past due',
  canceled: 'Canceled',
};

/** One label that folds `cancel_at_period_end` into the status, for the pill. */
export function subscriptionStatusLabel(
  subscription: Pick<Subscription, 'status' | 'cancel_at_period_end'>,
): string {
  if (subscription.status === 'active' && subscription.cancel_at_period_end) {
    return 'Active · ends at period end';
  }
  return SUBSCRIPTION_STATUS_LABELS[subscription.status];
}
