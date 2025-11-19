# ADR 0004 — Endpoint classes over fetch helpers

- **Status:** Accepted — **migration incomplete, see Consequences**
- **Date:** month 4
- **Author:** Tal Flexbox (Web)
- **Reviewers:** Roni Refactor

## Context

Before this ADR, every call site built its own request. The helpers in `src/api/legacy/` are
what that looked like:

- `fetch-json.ts` — `fetchJson(path, init)`; assembles headers inline.
- `api-fetch.ts` — a slightly later wrapper around `fetch-json.ts` that adds the base URL.
- `legacy-errors.ts` — throws a bare `Error` with the response text.
- `legacy-query.ts` — a `useEffect` fetch with its own `loading`/`error`/`data` state.

The cost was not the duplication. It was that each helper had a *different* answer to the four
questions every call has to answer, and nobody could see the differences from a call site:

| Question | `ApiClient` | `api-fetch.ts` |
|---|---|---|
| CSRF header | `X-Payzeno-CSRF` from the `pz_csrf` cookie, set in one place | built by hand, and it reads the cookie with a different regex |
| Idempotency | required parameter, one ULID per attempt, reused across transport retries | absent |
| Errors | `error-mapper.ts` → a `ConsoleApiError` subclass per status | `new Error(text)` |
| Retries | `retry.ts`, idempotent verbs only, 502/503/504/timeout | none |

The visible consequence: a 403 from a legacy path renders the generic error boundary fallback
instead of `<PermissionDenied/>`, because `<ErrorBoundary/>` switches on `ConsoleApiError`
subclasses and a bare `Error` matches none of them. A merchant admin who is not allowed to
invite users gets "Something went wrong".

## Decision

**All HTTP goes through an endpoint class. `src/api/legacy/` is frozen: no new files, no new
callers.**

- `abstract class ResourceEndpoint<TResource, TListQuery extends ListQuery>`
  (`src/api/endpoints/base.ts`) provides `list(q)` and `get(id)`, and nothing else. Ten direct
  concretes extend it. `get(id)` is mandatory on all ten — that is why
  `GET /v1/api-keys/:apiKeyId`, `GET /v1/bank-accounts/:bankAccountId` and
  `GET /v1/webhook_events/:eventId` exist at all.
- The four endpoints with no list/get pair — `auth`, `balance`, `reporting`,
  `webhook_endpoints` — are plain classes taking an `HttpTransport`. Forcing them under
  `ResourceEndpoint` would give them a `list()` that lies.
- `createEndpoints(transport)` in `src/api/endpoints/index.ts` is the one construction site,
  and the registry is handed to `<f>.queries.ts` as an argument (ADR 0002).
- `CODEOWNERS` puts `/src/api/legacy/` behind both of us. A change there needs an argument that
  it was unavoidable.

## Consequences

**The migration is about 85% done and it has been 85% done for four quarters.** This is
recorded here rather than quietly closed, because the code says so anyway:

| Legacy file | Live callers |
|---|---|
| `fetch-json.ts` | `features/invoices/invoices.queries.ts` |
| `api-fetch.ts` | `features/settings/useUsers.ts`, `features/settings/useInviteUser.ts` |
| `legacy-errors.ts` | both of the above |
| `legacy-query.ts` | `features/invoices` only |

So, concretely, today:

- **Invoices and the settings team tab do not participate in query invalidation.** Voiding an
  invoice elsewhere does not refresh the list.
- **They build `X-Payzeno-CSRF` themselves, slightly differently.** `src/api/http/csrf.ts` has
  a comment about this; the divergence is the whole point of this ADR.
- **Their errors bypass `error-mapper.ts`**, so their failure UI is the generic fallback.
- **`InvoicesEndpoint` already exists and is tested.** The endpoint class has been sitting
  there, unused by the feature, since month 4. The blocker is not the endpoint; it is that
  `legacy-query.ts`'s `useEffect` shape leaks into `InvoicesPage`'s render, and rewriting it is
  a bigger diff than any invoices ticket has ever justified. PAY-1744 and PAY-1902 are open.

`src/api/endpoints/statements.endpoint.ts` is a different kind of leftover: a correct endpoint
class pointing at `GET /v1/statements`, a route the ledger took over in MIG step 2. It has zero
importers and is not in the checked-in OpenAPI document — `src/api/contract/routes.contract.test.ts`
asserts both facts so that "delete it" stays a decision someone makes rather than a thing that
happens.

## Alternatives considered

**A generated SDK from the OpenAPI document.** Would remove the hand-written endpoint layer
entirely. Rejected because the generated client's error type is not `ConsoleApiError` and the
generated retry policy is not ours, so we would wrap it — and the wrapper is this layer, minus
the readable diffs. We do consume the document, in the contract test.

**Delete `src/api/legacy/` and fix the two features in one PR.** Estimated at two weeks with
the invoices rewrite. Proposed twice, deprioritised twice.
