/**
 * LEGACY. The original hand-rolled fetch helper, from before `ResourceEndpoint` existed.
 *
 * Still used by `features/invoices/invoices.queries.ts`. It builds its own CSRF header, does
 * not send `Payzeno-Version`, does not honour `X-Request-Id`, and its failures never become
