/**
 * Double-entry detail for one charge. Added by arc MIG step 2, when
 * `GET /v1/charges/:id/ledger` landed and the ledger became the source of truth for money
 * movement.
 *
 * Debits and credits are shown as the ledger records them, not netted. Support has to be
 * able to read this alongside the ledger's own `/internal/v1/transactions` output, and a
 * "helpful" simplification here is how you end up unable to explain a 4p discrepancy.
 */
