# ADR 0002 — One transport interface, one env read surface

- **Status:** Accepted
- **Date:** month 2
- **Author:** Tal Flexbox (Web)
- **Reviewers:** Roni Refactor, Dudi Hotfix (config section)

## Context

Sales needed to demo the dashboard without a backend. The first attempt at that was a
`?mock=1` branch inside four different hooks, each returning a hand-written object. It drifted
from the real response shapes within a fortnight, and the demo started showing a payout status
that the API cannot emit.

Separately, `import.meta.env` was being read in nine files. Two of them read
`VITE_PAYZENO_API_URL` and defaulted it differently when unset, so a misconfigured deploy
half-worked: the charges list called `/v1/charges` on the current origin and the WebSocket
connected to `undefined`.

Both problems are the same problem. A seam that is not named gets reimplemented at every call
site, slightly differently each time.

## Decision

**Two seams, each with exactly one definition.**

### 1. `HttpTransport` — `src/api/transport.ts`

Five methods (`request`, `get`, `post`, `patch`, `delete`), frozen by `interfaces.md` §4.2.
`idempotencyKey` is a required parameter on every mutating method, not an option bag field,
because an optional idempotency key is one that gets forgotten.

Two implementations, both wired in production code:

- `class ApiClient implements HttpTransport` (`src/api/client.ts`) — the real one. It is the
  only code in the repo that reads the `pz_csrf` cookie and sets `X-Payzeno-CSRF`, and the only
  place a `fetch` happens is below it, in `src/api/http/fetch-transport.ts`.
- `class MockTransport implements HttpTransport` (`src/api/mock/mock-transport.ts`) — answers
  from `src/api/mock/fixtures.ts` with seeded latency. Selected by
  `src/app/TransportProvider.tsx` on `?mock=1` or `pnpm dev:mock`.

The swap happens once, in `TransportProvider`, and reaches every call site because
`createEndpoints(transport)` is the single construction site for the registry and every
`<f>.queries.ts` receives that registry as an argument. No feature branches on mock mode. No
feature *can*.

### 2. `Env` — `src/config/env.ts`

Seven `VITE_*` variables, one zod-validated parse, one `interface Env`. `.eslintrc.cjs` bans
`import.meta` repo-wide and re-permits it for `src/config/env.ts` and `src/vite-env.d.ts` only.
A missing required variable throws `EnvConfigError` at module load; `src/main.tsx` boots
through dynamic imports specifically so that error is catchable and the user sees a sentence
instead of a white page.

**An eighth variable is a conversation, not a PR.** That constraint is what keeps
`src/lib/flags.ts` at exactly two flags.

## Consequences

- The demo cannot drift from the contract, because `MockTransport` returns the same
  `@payzeno/contracts` types the real client does and TypeScript checks the fixtures.
- `MockTransport` has to implement the whole interface even for routes the demo never shows.
  That is the cost, and `src/api/mock/mock-transport.test.ts` is contract-mandated for exactly
  this reason.
- Anything that needs configuration needs it through `Env`. There is no `process.env` escape
  hatch and no runtime `/config.json` fetch. Changing an environment means a rebuild, which is
  a real cost we accepted (see ADR 0001's note on flags being build-time).
- The WebSocket does not go through `HttpTransport` — it is not HTTP. `src/api/ws/` has its own
  small abstraction (`SocketClient`) with its own two implementations, following the same shape
  for the same reason.

## Alternatives considered

**MSW in production for the demo.** It works, and we use MSW in tests. But it intercepts at the
network layer, which means the demo build ships a service worker and the thing Sales runs is
not the thing we build. `MockTransport` is a normal object in a normal bundle.

**A runtime `config.json` fetched at boot.** Would let ops change the API URL without a
rebuild. It also adds a request before first paint, a failure mode before first paint, and a
config that TypeScript cannot see. Rejected; the environments are built by CI anyway.
