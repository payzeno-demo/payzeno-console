/**
 * `useCreatePayout()` — `POST /v1/payouts` (api-surface.md §12).
 *
 * The failures that actually happen, in order of frequency:
 *   409 `payout_blocked`     — the merchant's balance is negative, or the account is frozen.
 *   422 `currency_mismatch`  — the chosen bank account is not in the payout currency. Payzeno
 *                              does not convert; this is a real constraint, not a validator
 *                              being fussy.
 *   403                      — `payouts:write` is admin-only.
 *
