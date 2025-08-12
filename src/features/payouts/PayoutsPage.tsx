/**
 * `PayoutsPage` — the payouts index route. `PayoutDetailPage` is its child.
 *
 * This is where `payout.failed` surfaces (world-spec topology: payzeno-ledger emits it,
 * payzeno-api relays it, the console renders it). The push arrives on the notification
 * socket, `useNotificationStream` invalidates `queryKeys.payouts.all`, and this page reads the
 * unread `payout.failed` entries straight off the notification context so the merchant sees
 * the alert here as well as in the bell — a failed payout is the single most expensive thing
 * a merchant can miss.
 */
