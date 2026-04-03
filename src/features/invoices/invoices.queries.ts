/**
 * Invoice fetching. **This file is the arc-MIG holdout.**
 *
 * Every other feature in this console reaches payzeno-api through a `ResourceEndpoint` and
 * TanStack Query. Invoices do not: they call `src/api/legacy/fetch-json.ts` directly, and the
 * list is driven by `src/api/legacy/legacy-query.ts`, a pre-TanStack `useEffect` fetch with
 * its own loading state.
 *
