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

export type SurfacedNotificationType = (typeof SURFACED_NOTIFICATION_TYPES)[number];

export interface ConsoleNotification {
  id: string;
  type: PublicEventType;
  merchant_id: MerchantId;
  title: string;
  body: string;
  occurred_at: IsoTimestamp;
  /** The payout / batch / dispute id this points at. Drives the "View" link. */
  resource_id: string;
}

/** A notification plus the console's own local read state. Never sent to the server. */
export interface NotificationEntry extends ConsoleNotification {
  read: boolean;
  receivedAt: number;
}

export type NotificationSeverity = 'critical' | 'warning' | 'info';

export function severityOf(type: PublicEventType): NotificationSeverity {
  switch (type) {
    case 'payout.failed':
    case 'payout.returned':
      return 'critical';
    case 'dispute.opened':
      return 'warning';
    default:
      return 'info';
  }
}

/** Runtime guard for a frame off the socket. A malformed frame must not enter the list. */
export function isConsoleNotification(value: unknown): value is ConsoleNotification {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.merchant_id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.body === 'string' &&
    typeof candidate.occurred_at === 'string' &&
    typeof candidate.resource_id === 'string'
  );
}

export function isSurfaced(type: PublicEventType): type is SurfacedNotificationType {
  return (SURFACED_NOTIFICATION_TYPES as ReadonlyArray<string>).includes(type);
}
