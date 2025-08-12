/**
 * Query/mutation factories for `features/payouts`. The ONLY caller of `PayoutsEndpoint`.
 *
 * Every route here is a read-through to payzeno-ledger via payzeno-api: the ledger owns
 * payouts, the API owns the merchant scope. That is why a payout mutation invalidates the
 * balance too — the two live in the same double-entry world and a payout moves
