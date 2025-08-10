/**
 * Query/mutation factories for `features/refunds`. The ONLY caller of `RefundsEndpoint`.
 *
 * A refund is always against a charge, never against a payment intent — `CreateRefundRequest`
 * takes `charge_id`. Cancelling an uncaptured authorisation is a different operation and
 * lives in `features/payments`.
 */
