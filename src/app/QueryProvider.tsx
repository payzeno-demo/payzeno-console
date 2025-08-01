/**
 * TanStack Query is the **only** cache in this application (ADR 0001).
 *
 * There is no redux store, no zustand, no bespoke `useFetch`. Server state lives here; UI
 * state lives in the URL (`hooks/useQueryParamState.ts`) or in a component. The two things
 * that violate this both live in `src/api/legacy/` and both have tickets.
 *
 * The retry policy is the interesting part, and it is written against the
 * `ConsoleApiError` tree rather than against status numbers:
 *
 *  - never retry a 4xx. A 403 does not become a 200 because you asked twice, and retrying a
 *    409 during the settlement incident made the duplicate-detection alarm noisier than the
 *    duplicates (the-incident.md §5);
 *  - always retry `UpstreamUnavailableApiError` (502) — that is the ledger redeploying or an
 *    acquirer breaker tripping, and it clears in seconds;
 *  - honour `Retry-After` on 429 instead of backing off blindly;
