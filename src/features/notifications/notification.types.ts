/**
 * The push-notification payload the console receives over `/ws/notifications`.
 *
 * The producer is payzeno-api's `NotificationsGateway`, whose own
 * `src/notifications/notification.types.ts` declares the identical shape. This is not a
 * `@payzeno/contracts` type — it never crosses the public API — but its `type` field is
 * `PublicEventType`, which is, so the vocabulary stays shared.
 *
 * The console surfaces exactly three of them (api-surface.md §14):
 *   payout.failed         — the loud one. The merchant's money did not arrive.
 *   settlement.completed  — informational.
 *   dispute.opened        — actionable, evidence clock starts.
 */
import type { IsoTimestamp, MerchantId, PublicEventType } from '@payzeno/contracts';

/** The subset of `PublicEventType` the relay actually forwards to a console socket. */
export const SURFACED_NOTIFICATION_TYPES = [
  'payout.failed',
  'settlement.completed',
  'dispute.opened',
] as const satisfies ReadonlyArray<PublicEventType>;

export type NotificationSeverity = 'critical' | 'warning' | 'info';

