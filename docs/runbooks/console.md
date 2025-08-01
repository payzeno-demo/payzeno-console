# Runbook — payzeno-console

Owner: Web (`@tflexbox`). On-call co-owner: `@apager`.

The console is a static bundle. It has no database, no queue and no server-side code — nginx
serves `dist/` and payzeno-nginx puts `/v1` and `/ws` on the same origin. So there are exactly
three families of console incident: **the bundle is wrong**, **the config is wrong**, or
**payzeno-api is unhappy and the console is the place people notice**.

Sections are ordered by how often they get opened.

---

## 1. "The dashboard is white"

A blank page with no error UI means the app never mounted. `<ErrorBoundary/>` cannot render an
error it was not alive to catch.

**Check the browser console first.** There are only three realistic causes.

### 1.1 `EnvConfigError: VITE_… is required`

The most common one. A required build variable was missing when CI built the bundle, so
`src/config/env.ts` threw at module load.

`src/main.tsx` boots through dynamic imports specifically so this is catchable, and it renders
the variable name. If you see a *bare* white page instead of that message, the failure is
earlier than `main.tsx` — go to §1.2.

- **Confirm:** `curl -s https://<host>/ | grep -o 'assets/index-[a-z0-9]*\.js'`, fetch that
  asset, and grep it for the environment name. The seven `VITE_*` values are **baked into the
  bundle** — there is no runtime config (ADR 0002).
- **Fix:** correct the variable in the environment's build config and **rebuild**. Restarting
  nginx does nothing. Rolling back to the previous bundle is faster and is the right first move
  if the missing variable is not obvious.

### 1.2 A chunk 404s

`vite.config.ts` splits `react`, `query`, `charts` and `telemetry` into their own chunks. A
partial upload, or a CDN that cached `index.html` from the new deploy and chunks from the old
one, gives you a dynamic-import failure on a route that used to work.

- **Confirm:** Network tab, filter to `assets/`, look for a 404 or an HTML body served for a
  `.js` request.
- **Fix:** re-run the deploy so the whole `dist/` lands, then invalidate the CDN path for
  `index.html` only. Never cache `index.html`.

### 1.3 The bundle is fine and the session is not

Not actually white — you land on `/login` and bounce. See §3.

---

## 2. Settlements are slow or the batch page times out

The console's item list is the heaviest read it makes. `SETTLEMENT_ITEM_PAGE_SIZE` is 50 and
`LONG_READ_TIMEOUT_MS` is 30s (`src/config/constants.ts`) — the only route in the app with a
timeout override, because the ledger's item query is genuinely slow on a large batch.

### 2.1 Mitigation: turn `settlement_explorer` off

**This is the documented mitigation and `src/router.tsx` reads the flag for exactly this
reason.** Set `VITE_FEATURE_SETTLEMENT_EXPLORER=false`, rebuild, deploy. The settlements routes
then render a "not available" page pointing merchants at payouts, which answers the question
they were actually asking ("did the money arrive?") without touching the item query.

It defaults **on** and has for months. Turning it off is a load-shedding lever, not a rollback.

- **Cost:** merchants lose per-item visibility until it goes back on.
- **It does not help** if the slow thing is `GET /v1/settlements` itself — that is the list, not
  the explorer, and it is still on the payouts path.

### 2.2 If you are being asked to "just raise the page size"

No. It was 500 and cursor-less, and that call pattern is what produced the ledger's month-7
regression and migration 14 on the API side. The page size came *down* on purpose.

---

## 3. Everyone is being redirected to `/login`

`src/app/AuthProvider.tsx` bootstraps from `useSession()` (`GET /v1/auth/me`) and redirects to
`/login` on `UnauthorizedError`. A fleet-wide redirect means the API is 401ing valid sessions.

- Check payzeno-api's session store (Redis) first — this is almost never a console change.
- **The console-side cause worth knowing:** the `pz_csrf` cookie. `ApiClient` is the only code
  that reads it and sets `X-Payzeno-CSRF` (`src/api/http/csrf.ts`). If the console is served
  from a different origin than `/v1` — which happens when someone bypasses payzeno-nginx — the
  cookie is third-party, the header is empty, and every mutation 403s while reads still work.
  Symptom: the app looks fine until you click anything.

---

## 4. "Retry did nothing" on a settlement item

Expected, and not an error. `useRetrySettlementItem()` treats **`409 settlement_locked` as a
no-op**: the ledger's `RetryScheduler` takes the batch advisory lock before claiming the item
(PAY-2043), so a manual retry that races the 900s sweep loses, and the item is being settled
anyway. The console shows "already being settled", refetches the item, and deliberately does
**not** toast an error.

If finance reports that retry "does nothing", check whether the item's status changed a few
seconds later. It usually did.

Anything other than 409 on that route *is* an error and surfaces normally.

---

## 5. The notification bell stopped updating

`src/api/ws/notification-socket.ts` connects to `VITE_WS_URL` with exponential backoff
(`WS_BACKOFF_MS`) and a heartbeat. After `MAX_RECONNECTS` it gives up and throws
`NotificationStreamError` (`src/lib/errors.ts`), which is a client-side error branch — no HTTP
response is involved, so nothing appears in payzeno-api's logs on the console's behalf.

- The console is a **client**, not a consumer. It subscribes to payzeno-api's
  `NotificationsGateway`; it is not on the bus. If notifications are missing for everyone, the
  question is whether `NotificationRelayConsumer` is draining, not whether the socket is open.
- Nothing else in the app depends on the socket. A dead bell is a degraded bell, not an outage.
- The upgrade request carries the session cookie and CSRF, so §3's origin problem breaks the
  socket too, and breaks it first.

---

## 6. A whole feature renders an error page

`src/components/feedback/ErrorBoundary.tsx` is the only place a `ConsoleApiError` is rendered,
and it switches on the subclass. What you see tells you the status without opening devtools:

| What renders | Subclass | Status | Where to look |
|---|---|---|---|
| `<PermissionDenied/>` | `ForbiddenError` | 403 | the user's role, or §3's CSRF case on a mutation |
| `<NotFound/>` | `NotFoundApiError` | 404 | a stale link, or an id from another merchant |
| `<RateLimitCountdown/>` | `RateLimitedApiError` | 429 | payzeno-api rate limits; the countdown reads `Retry-After` |
| `<UpstreamDown/>` with retry | `UpstreamUnavailableApiError` | 502 | payzeno-api's upstream (ledger, biller, acquirer) |
| generic fallback | `ServerError` | 5xx / unmapped | payzeno-api logs, by `requestId` |

Every error carries the `X-Request-Id` the response came back with, and the boundary shows it.
**Ask the reporter for that id** — it is the fastest join into payzeno-api's logs.

> One exception, and it is the ADR 0004 debt: **invoices** and the **settings team tab** go
> through `src/api/legacy/`, which throws a bare `Error`. They render the generic fallback for
> everything, including a 403. If someone reports "Something went wrong" on either of those,
> you get no status from the UI and have to go to the API logs.

---

## 7. Rolling back

The bundle is immutable and content-hashed, so rollback is redeploying the previous build.
There is no migration and no state to unwind — the console holds nothing that survives a
reload except URL state.

Two things a rollback does **not** fix:

- A wrong `VITE_*` value that was also wrong in the previous build (§1.1).
- Anything actually caused by payzeno-api.

---

## 8. Running it on the mock transport

`?mock=1` on any URL, or `pnpm dev:mock`, swaps `ApiClient` for `MockTransport`
(`src/app/TransportProvider.tsx`) and serves everything from `src/api/mock/fixtures.ts`. Sales
demos on it.

It is also the fastest way to answer "is this a console bug or an API bug": if the page renders
correctly under `?mock=1`, the component is fine and the problem is upstream of the transport.
