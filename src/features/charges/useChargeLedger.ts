/**
 * `useChargeLedger(id)` — `GET /v1/charges/:id/ledger` (api-surface.md §12).
 *
 * arc MIG step 2. Before the ledger owned balances this view did not exist: the legacy
 * biller could tell you a total and nothing else. Now every posting against the charge —
 * auth, capture, fee, settlement, refund, dispute — is visible with its double-entry legs,
 * which is what support actually needs when a merchant asks where their money went.
