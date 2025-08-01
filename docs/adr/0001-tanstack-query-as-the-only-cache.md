# ADR 0001 — TanStack Query is the only cache in the console

- **Status:** Accepted
- **Date:** month 1
- **Author:** Tal Flexbox (Web)
- **Reviewers:** Roni Refactor

## Context

The console had three caches at once and nobody had decided that on purpose.

1. TanStack Query, introduced for the payments list.
2. A `useEffect` + `useState` fetch in `src/api/legacy/legacy-query.ts`, which the invoices
   feature still uses and which holds its own `loading` / `error` / `data` triple.
3. A handful of `useState`s in page components that held a server response so a child could
   read it without refetching.

Three caches means three invalidation stories, and only one of them was written down. The
symptom that started this: refunding a charge updated the charge detail page and left the
charges *list* showing the old `amount_refunded_minor` until a hard reload, because the list
was in (1) and the detail page had put its copy in (3).

React Router's `loader`/`action` API was on the table as a fourth option, since we were already
on React Router 6. It is a genuinely good router-owned cache. It is also a *second* one.

## Decision

**Server state lives in TanStack Query. Nothing else caches a server response.**

Concretely:

- `src/app/QueryProvider.tsx` builds the one `QueryClient`. There is no second client, and
  tests get theirs from `src/test/render.tsx` so that a leaked cache between cases is
  impossible rather than merely unlikely.
- Every query key comes from `src/api/queryKeys.ts`. It is the most-imported module in the
  repo (~40 importers) precisely because an invalidation has to be able to name what it is
  invalidating without guessing.
- Every `queryOptions` / mutation factory lives in `features/<f>/<f>.queries.ts` and takes the
  `EndpointRegistry` as an argument. Hooks call the factory; components call the hook.
- `src/router.tsx` declares **no** `loader` and **no** `action`. That is the whole reason the
  route table is as flat as it is.
- Putting a server response in `useState` is a review rejection. Derived *view* state
  (a selected row, an expanded panel) is fine and is what `useState` is for.

The retry policy lives with the client, not with the call sites: `QueryProvider` inspects the
thrown `ConsoleApiError` and never retries a 4xx, retries `UpstreamUnavailableApiError`, and
leaves `RateLimitedApiError` to `<RateLimitCountdown/>`. A call site that wants different
behaviour is describing a different query, not a different policy.

## Consequences

- Invalidation is a first-class thing you write, not a thing you hope for. Every mutation hook
  ends with an explicit `invalidateQueries` against a key from `queryKeys.ts`.
- `src/api/legacy/legacy-query.ts` is a standing violation of this ADR. It is grandfathered,
  not permitted: it has a `FIXME` at the top pointing at ADR 0004, and invoices — its only
  caller — does not participate in invalidation at all. When a merchant voids an invoice in
  the biller and the console still shows it as open, this is why.
- URL state is not server state and is not covered here. Filters and pagination live in the
  query string via `src/hooks/useQueryParamState.ts`, so a support engineer can be sent a link.
  That is also why `src/hooks/useLocalStorage.ts` has no importers.

## Alternatives considered

**React Router loaders.** Would have given us parallel data loading per route for free. It also
puts the cache in the router, which means the router has to know about auth, the endpoint
registry and the `?mock=1` transport swap. We would have ended up passing the `QueryClient`
into loaders anyway, at which point there are two caches again.

**Redux Toolkit Query.** Same job, more ceremony, and it wants to own the store. We have no
client store worth the name.
