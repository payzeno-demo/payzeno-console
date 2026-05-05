/**
 * LEGACY. The original hand-rolled fetch helper, from before `ResourceEndpoint` existed.
 *
 * Still used by `features/invoices/invoices.queries.ts`. It builds its own CSRF header, does
 * not send `Payzeno-Version`, does not honour `X-Request-Id`, and its failures never become
 * a `ConsoleApiError`.
 *
 * FIXME(rrefactor): migrate invoices to `InvoicesEndpoint` — docs/adr/0004-endpoint-classes-over-fetch-helpers.md.
 * Blocked on nothing. Deprioritised four quarters running. PAY-1902.
