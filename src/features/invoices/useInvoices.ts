/**
 * `useInvoices(q)` — `GET /v1/invoices` (api-surface.md §12).
 *
 * The one contracted hook in this console that is not backed by TanStack Query. It wraps
 * `useLegacyQuery`, which is a `useEffect` fetch with its own loading state, so:
 *  - there is no cache, no dedupe and no background refresh;
 *  - `refetch()` is the only way to see a change;
 *  - errors are bare `Error`s from `legacy-errors.ts`, not `ConsoleApiError`s.
